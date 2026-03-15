import sys
import os
from typing import Dict, Any

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "tools"))
from master_data import check_master_data
from strategic_matrix import check_strategic_matrix

# LangGraph specific imports
from protocol import AgentState, A2AMessage
import datetime

class SCMAnalystAgent:
    """
    Wraps the Rules 1-4 STO Classification logic for LangGraph.
    Takes AgentState as input, outputs modified AgentState.
    """
    def __init__(self):
        # We can reuse the internal logic from the STOClassifier
        pass
        
    def _internal_classify(self, sto: Dict[str, Any]) -> Dict[str, Any]:
        source = sto.get('source_location')
        dest = sto.get('destination_location')
        sku = sto.get('sku_id')
        
        source_md = check_master_data(sku, source)
        dest_md = check_master_data(sku, dest)
        source_is_plant = source_md.get('destination_plant_exists', False)
        dest_is_plant = dest_md.get('destination_plant_exists', False)
        
        if not source_is_plant and not dest_is_plant:
            return {"c": "UNPRODUCTIVE", "r": 2, "rc": "Incorrect Deployments", "txt": "DC -> DC (Lateral)"}
            
        if not source_is_plant and dest_is_plant:
            return {"c": "UNPRODUCTIVE", "r": 3, "rc": "Incorrect Deployments", "txt": "DC -> Plant (Reverse)"}
            
        if source_is_plant and not dest_is_plant:
            lane_info = check_strategic_matrix(source, dest)
            if lane_info.get("is_strategic_lane") and lane_info.get("capacity_utilization", 0.0) < 0.95:
                return {"c": "PRODUCTIVE", "r": 1, "rc": "None", "txt": "Plant -> DC (Strategic)"}
            else:
                return {"c": "UNPRODUCTIVE", "r": 1, "rc": "Sales Over Forecast", "txt": "Plant -> DC (Non-Strategic)"}

        if source_is_plant and dest_is_plant:
            if dest_md.get("source_model") == "DUAL":
                return {"c": "UNPRODUCTIVE", "r": 4, "rc": "Planning Error", "txt": "Plant -> Plant (Dual)"}
            elif dest_md.get("source_model") == "SINGLE":
                if not dest_md.get("is_sourcing_plant"):
                    return {"c": "PRODUCTIVE", "r": 4, "rc": "None", "txt": "Plant -> Plant (Single)"}
                else:
                    return {"c": "UNPRODUCTIVE", "r": 4, "rc": "Incorrect Deployments", "txt": "Plant -> Plant (Reverse Single)"}

        return {"c": "UNKNOWN", "r": 0, "rc": "Unknown", "txt": "Escalate"}

    def invoke(self, state: AgentState) -> AgentState:
        """
        LangGraph Node invocation function
        """
        sto = state.sto
        res = self._internal_classify(sto)
        
        # Format the A2A Message
        msg = A2AMessage(
            sender="scm_analyst",
            receiver="orchestrator",
            message_type="RESPONSE",
            payload=res,
            confidence=1.0 if res["c"] != "UNKNOWN" else 0.0,
            trace_id=sto.get("sto_id", "unknown")
        )
        
        # Update State
        state.add_message(msg)
        state.classification = res["c"]
        state.rule_applied = res["r"]
        state.root_cause = res["rc"]
        state.reasoning_text = res["txt"]
        state.confidence = msg.confidence
        
        return state

# Fallback for old standalone testing if needed
class STOClassifier(SCMAnalystAgent):
    def classify_sto(self, sto: Dict[str, Any]) -> Dict[str, Any]:
        res = self._internal_classify(sto)
        return {
            "sto_id": sto.get("sto_id"),
            "classification": res["c"],
            "rule_applied": res["r"],
            "root_cause": res["rc"],
            "confidence": 1.0 if res["c"] != "UNKNOWN" else 0.0,
            "reasoning_text": res["txt"]
        }
