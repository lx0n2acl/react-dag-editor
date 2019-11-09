
import React, { Component } from 'react'
import ReactDom from 'react-dom'
import * as d3 from 'd3';
import * as d3dag from 'd3-dag';

import DagEdge from './DagEdge'
import DagNode from './DagNode';

import DagNodeData from '../dto/DagNodeData'
import DagEdgeData from '../dto/DagEdgeData'

const CREATE_NODE = "CREATE_NODE";
const RESET_LAYOUT = "RESET_LAYOUT";
const SAVE_LAYOUT = "SAVE_LAYOUT";
const LOAD_LAYOUT = "LOAD_LAYOUT";


export default class DagEditor extends React.Component {
    svgRef = React.createRef();

    state = {
        nodes: [],
        edges: [],
        selected: null,
        dragging: false,
        dragOffset: null,
        hoveringOverNode: null,
        creatingEdge: null

    };

    componentDidMount() {
        try {
            // load state from disk
        } catch (err) {
            console.warn("Failed to restore state", err);
        }
    }

    componentDidUpdate() {
        // save state to disk
    }

    getCoords({ clientX, clientY }) {
        const { top, left } = this.svgRef.current.getBoundingClientRect();
        return { x: clientX - left, y: clientY - top };
    }

    handleNodeTextSubmit = (id, title) => {
        const { nodes, selected } = this.state;
        let selectedNode = nodes.find(n => n.id === selected);

        if (selectedNode !== null) {
            this.setState((ps) => ({ //
                ...ps,
                nodes: ps.nodes.map(n => n.id === id ? Object.assign(n, { title }) : n)
            }));
        }
    }
    handleMenuClick(command) {
        switch (command) {
            case CREATE_NODE:
                this.createNode(new DagNodeData({ id: Date.now(), layer: 0, x: 10, y: 10 }))

                break;
            case RESET_LAYOUT:
                // let crap = this.state.edges.map(e => { return { e.sourceNode, target: e.targetNode.id } });
                // console.log(crap)

                // edgeData.push(new DagEdgeData(Date.now(), new DagNodeData(undefined), this.state.nodes[0]));
                let dag = d3dag.dagConnect()
                    .sourceAccessor((e) => e.sourceNode.id)
                    .targetAccessor((e) => e.targetNode.id)(this.state.edges);

                d3dag.sugiyama()
                    .size([1000, 600])
                    .coord(d3dag.coordGreedy())
                    .layering(d3dag.layeringCoffmanGraham().width(100))(dag);


                let newNodes = dag.descendants().map(d =>
                    Object.assign(this.state.nodes.find(n => n.id == d.id), { x: d.x }, { y: d.y + (d.layer * 100) }, { layer: d.layer }));


                this.setState({ nodes: newNodes })
                break;
            case SAVE_LAYOUT:
                //this.saveLayout();

                localStorage.setItem("dagLayout_nodes", this.state.nodes.map(n => n.serialize()));
                localStorage.setItem("dagLayout_edges", this.state.edges.map(e => e.serialize()));

                break;
            case LOAD_LAYOUT:
                //this.saveLayout();
                this.setState({ nodes: JSON.parse(localStorage.getItem("dagLayout_nodes").map(n => new DagNodeData(n))) });

                let nodes = JSON.parse(localStorage.getItem("dagLayout_nodes")).map(n =>
                    new DagNodeData(n));

                let edges = JSON.parse(localStorage.getItem("dagLayout_edges")).map(e =>
                    new DagEdgeData({
                        id: e.id,
                        sourceNode: new DagNodeData(e.sourceNode),
                        targetNode: new DagNodeData(e.targetNode)
                    }
                    ));
                console.log(edges)
                this.setState({ nodes, edges });

                break;
            default:

        }
    }

    createNode(newNode) {
        const { nodes } = this.state;
        this.setState({ nodes: [...nodes, newNode] })

    }

    createEdge(newEdge) {
        const { edges } = this.state;
        this.setState({ edges: [...edges, newEdge] })

    }

    setHoverNode(n) {
        console.log("hovering over node: ", n)
        this.setState({
            hoveringOverNode: n,
        });
    }

    dragNode(e, n) {
        e.stopPropagation();
        let { x, y } = this.getCoords(e);
        this.setState({
            selected: n.id,
            dragging: true,
            dragOffset: { x: x - n.coords.x, y: y - n.coords.y }
        });
    }

    dragNewEdge(sourceNode) {
        const currentHeadLocationCoords = Object.assign({}, sourceNode.edgeSourceCoords)
        this.setState({
            creatingEdge: { sourceNode, currentHeadLocationCoords }

        });
    }

    handleMouseDown(e, id) {
        const { shiftKey } = e;
        const { x: xStart, y: yStart } = this.getCoords(e);
        console.log("mouse down canvas")

    }

    handleMouseMove(e) {
        const { nodes, selected, dragging, creatingEdge, dragOffset } = this.state;
        let selectedNode = nodes.find(n => n.id === selected);

        if (dragging && selectedNode !== null) {
            const { x, y } = this.getCoords(e);
            this.setState((ps) => ({ //
                ...ps,
                nodes: ps.nodes.map(n => n.id === selectedNode.id ? Object.assign(n, { coords: { x: x - dragOffset.x, y: y - dragOffset.y }}) : n)
            }));

        }

        if (creatingEdge !== null) {
            const { x, y } = this.getCoords(e);

            this.setState((ps) => ({ //
                creatingEdge: { ...ps.creatingEdge, currentHeadLocationCoords: { x, y } }
            }));

        }
    }

    handleMouseUp(e) {
        const { creatingEdge, hoveringOverNode } = this.state;
        if (creatingEdge !== null && hoveringOverNode !== null) {
            this.createEdge(new DagEdgeData({ sourceNode: creatingEdge.sourceNode, targetNode: hoveringOverNode}))
        }

        this.setState({ dragging: false, dragOffset: null, creatingEdge: null })
    }


    renderArrowHeadDefs = () => {
        return <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
    }
    render() {
        const { nodes, edges, creatingEdge } = this.state;

        return (
            <div className="canvas">
                <div className="toolbar">
                    {[[CREATE_NODE, "Create Node"], [RESET_LAYOUT, "Reset Layout"], [SAVE_LAYOUT, "Save Layout"], [LOAD_LAYOUT, "Load Layout"],].map(menu => (
                        <button key={menu[0]}
                            onClick={() => this.handleMenuClick(menu[0])}>
                            {menu[1]}
                        </button>
                    ))}
                </div>
                <svg onMouseDown={this.handleMouseDown.bind(this)}
                    onMouseUp={this.handleMouseUp.bind(this)}
                    onMouseMove={(e) => this.handleMouseMove(e)}
                    ref={this.svgRef}>
                    <defs>
                        {this.renderArrowHeadDefs()}

                    </defs>
                    <g>{nodes.map(n => <DagNode key={n.id} //
                        id={n.id}
                        title={n.title}
                        layer={n.layer}
                        coords={n.coords}
                        width={n.width}
                        height={n.height}
                        dragNode={(e) => this.dragNode(e, n)}
                        dragNewEdge={() => this.dragNewEdge(n)}
                        onTextSubmit={(id, title) => this.handleNodeTextSubmit(id, title)}
                        setHoverNode={(isHovering) => this.setHoverNode(isHovering ? n : null)}
                    />)
                    }

                    </g>
                    <g>
                        {edges.map(e => <DagEdge key={e.id} sourceCoords={e.sourceNode.edgeSourceCoords}
                            targetCoords={e.targetNode.edgeTargetCoords}  ></DagEdge>)}
                    </g>
                    <g>
                        {creatingEdge !== null ?
                            <DagEdge
                                sourceCoords={creatingEdge.sourceNode.edgeSourceCoords}
                                currentHeadLocationCoords={creatingEdge.currentHeadLocationCoords} /> : null}</g>
                </svg>
            </div>
        );
    }
}
