"""
LangGraph agent graph definition - state machine orchestration
"""
from langgraph.graph import StateGraph, END
from app.agent.state import AgentState
from app.agent.nodes import (
    init_node,
    fetch_stock_data_node,
    calc_indicators_node,
    fundamental_analysis_node,
    generate_analysis_node,
    format_response_node
)


def create_agent():
    """
    Create and return the LangGraph agent
    
    Flow: INIT → FETCH_STOCK_DATA → CALC_INDICATORS → 
          GENERATE_ANALYSIS → FORMAT_RESPONSE → DONE
    """
    # Create state graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("init", init_node)
    workflow.add_node("fetch_stock_data", fetch_stock_data_node)
    workflow.add_node("calc_indicators", calc_indicators_node)
    workflow.add_node("fundamental_analysis", fundamental_analysis_node)
    workflow.add_node("generate_analysis", generate_analysis_node)
    workflow.add_node("format_response", format_response_node)
    
    # Define edges (flow)
    workflow.set_entry_point("init")
    workflow.add_edge("init", "fetch_stock_data")
    workflow.add_edge("fetch_stock_data", "calc_indicators")
    workflow.add_edge("calc_indicators", "fundamental_analysis")
    workflow.add_edge("fundamental_analysis", "generate_analysis")
    workflow.add_edge("generate_analysis", "format_response")
    workflow.add_edge("format_response", END)
    
    # Compile the graph
    app = workflow.compile()
    
    return app


