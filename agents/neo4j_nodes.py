import os
from neo4j import GraphDatabase
from protocol import AgentState

class Neo4jMemoryNode:
    """
    A LangGraph node responsible for querying the Neo4j database to extract supply chain relationships.
    """
    def __init__(self):
        # In a real deployed app, these come from os.getenv
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            print("[NEO4J] Connected to Graph Database successfully.")
        except Exception as e:
            print(f"[NEO4J WARNING] Could not connect to Neo4j. Operating with mock graph data. {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def retrieve_graph_context(self, state: AgentState) -> AgentState:
        """
        The executable node function for LangGraph.
        Retrieves alternative routes or upstream/downstream impacts from the graph.
        """
        print(f"[LANGGRAPH] Executing Neo4j Node for STO: {state.sto.get('sto_id')}")
        
        source = state.sto.get('source_location')
        sku = state.sto.get('sku_id')
        
        extracted_paths = []
        if self.driver:
            # Example Cypher: Finding alternative DCs that stock the same SKU and have a route to the destination
            query = """
            MATCH (alt_dc:DC)-[:STOCKS]->(s:SKU {id: $sku})
            WHERE alt_dc.id <> $source AND s.quantity > 0
            RETURN alt_dc.id AS alternative_dc, s.quantity AS available
            LIMIT 3
            """
            with self.driver.session() as session:
                try:
                    result = session.run(query, source=source, sku=sku)
                    for record in result:
                        extracted_paths.append({
                            "type": "neo4j",
                            "source": f"({record['alternative_dc']})-[STOCKS]->({sku})",
                            "confidence": 0.95,
                            "text_snippet": f"Found alternative DC {record['alternative_dc']} with {record['available']} stock."
                        })
                except Exception as e:
                    print(f"Cypher error: {e}")
        else:
            # Fallback mock for MVP if Docker Neo4j isn't running yet
            extracted_paths.append({
                "type": "neo4j",
                "source": f"(DC_Backup)-[STOCKS]->({sku})",
                "confidence": 0.92,
                "text_snippet": f"Mock Graph Traverse: DC_Backup has {sku} available."
            })
            
        # Append to state memory
        state.graph_context.extend(extracted_paths)
        return state
