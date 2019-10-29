
import React, { Component } from 'react'
import ReactDom from 'react-dom'
import * as d3 from 'd3';
import * as d3dag from 'd3-dag';

const CREATE_NODE = "CREATE_NODE";
const RESET_LAYOUT = "RESET_LAYOUT";

// const NODE_WIDTH = 200;
// const NODE_HEIGHT = 50;

class DagNodeData {
    constructor(id, title, x, y) {
        this.id = id;
        this.title = title;
        this.x = x;
        this.y = y;
        this.w = 200;
        this.h = 50;
        this.getEdgeSourceCoords = () => { return { x: this.x + (this.w / 2), y: this.y + this.h } }
        this.getEdgeTargetCoords = () => { return { x: this.x + (this.w / 2), y: this.y } }
    }
}

class DagEdgeData {
    constructor(id, sourceNode, targetNode) {
        this.id = id;
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;

    }
}

const DagEdge = ({ sourceCoords, targetCoords, currentHeadLocationCoords }) => {
    console.log(sourceCoords, targetCoords, currentHeadLocationCoords)
    const { x: sx, y: sy } = sourceCoords;
    const { x: tx, y: ty } = targetCoords || currentHeadLocationCoords;

    const line = d3.line()
        .curve(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y)([{ x: sx, y: sy }, { x: sx, y: (sy + ((ty - sy) / 2)) }, { x: tx, y: (sy + ((ty - sy)) / 2) }, { x: tx, y: ty }]);

    return (
        <path markerEnd="url(#arrow)"
            className={!targetCoords ? "newEdge" : "existingEdge"}
            fill="transparent"
            d={line}
            strokeWidth={3}
        />

    );
}


class DagNode extends React.Component {
    constructor(props) {
        super(props);
        this.titleInputRef = React.createRef();

    }
    state = {
        editMode: false,
        titleInput: ""
    }
    handleNodeTextInput = (e) => {
        this.setState({ titleInput: e.target.value });
    }
    render() {
        const { id, title, x, y, w, h, selected, dragNode, dragNewEdge, onTextSubmit, setHoverNode } = this.props;

        return (
            <g
                transform={"translate(" + x + "," + y + ")"}
                onDoubleClick={(e) => {
                    this.setState((ps) => ({ editMode: !ps.editMode }))

                    // wait for element to become visible
                    setTimeout(() => {
                        this.titleInputRef.current.focus();
                        this.titleInputRef.current.select()
                    }, .5);
                }}
                onMouseDown={dragNode}
                onMouseEnter={() => setHoverNode(true)}
                onMouseLeave={() => setHoverNode(false)}

            >
                <rect
                    key={id}
                    className="dagNode"
                    width={w}
                    height={h}
                    rx={10}
                    ry={10}
                    fill={selected ? "#003366" : "#aabbcc"}
                />
                <g>
                    <foreignObject x="10" y="10" width={w - 10} height={h / 2} visibility={this.state.editMode ? "visible" : "hidden"}>
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <input ref={this.titleInputRef}
                                onKeyDown={(e) => {
                                    if (this.state.editMode && e.keyCode === 13) { //enter
                                        this.setState({ editMode: false })

                                        onTextSubmit(id, this.state.titleInput);
                                    } else if (e.keyCode === 27) { //esc
                                        this.setState({ editMode: false })
                                    }
                                }}
                                onBlur={(e) => {
                                    this.setState({ editMode: false })
                                }}
                                defaultValue={title} value={this.state.textInput} onChange={(e) => this.handleNodeTextInput(e)}  >
                            </input>
                        </div>
                    </foreignObject>
                    <text x="10" y="25" className="nodeText" visibility={!this.state.editMode ? "visible" : "hidden"}>{title}</text>
                </g>
                <circle cx={w / 2} cy={h} r="10"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        dragNewEdge()
                    }} />
            </g>

        );
    }
}

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
                this.createNode(new DagNodeData(Date.now(), "Your title here...", 10, 10))

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
        console.log("hovering over", n)
        this.setState({
            hoveringOverNode: n,
        });
    }

    dragNode(e, obj) {
        e.stopPropagation();

        let { x, y } = this.getCoords(e);
        this.setState({
            selected: obj.id,
            dragging: true,
            dragOffset: { x: x - obj.x, y: y - obj.y }
        });
    }

    dragNewEdge(sourceNode) {
        const currentHeadLocationCoords = Object.assign({}, sourceNode.getEdgeSourceCoords())
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
                nodes: ps.nodes.map(n => n.id === selectedNode.id ? Object.assign(n, { x: x - dragOffset.x, y: y - dragOffset.y }) : n)
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
            console.log("creating edge source", creatingEdge.sourceNode)
            console.log("dropped over", hoveringOverNode)
            this.createEdge(new DagEdgeData(Date.now(), creatingEdge.sourceNode, hoveringOverNode))
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
        console.log(nodes)
        console.log(edges)
        return (
            <div className="canvas">
                <div className="toolbar">
                    {[[CREATE_NODE, "Create Node"], [RESET_LAYOUT, "Reset Layout"]].map(menu => (
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
                        {...n}
                        dragNode={(e) => this.dragNode(e, n)}
                        dragNewEdge={() => this.dragNewEdge(n)}
                        onTextSubmit={(id, title) => this.handleNodeTextSubmit(id, title)}
                        setHoverNode={(isHovering) => this.setHoverNode(isHovering ? n : null)}
                    />)
                    }

                    </g>
                    <g>
                        {edges.map(e => <DagEdge key={e.id} sourceCoords={e.sourceNode.getEdgeSourceCoords()}
                            targetCoords={e.targetNode.getEdgeTargetCoords()}  ></DagEdge>)}
                    </g>
                    <g>
                        {creatingEdge !== null ?
                            <DagEdge
                                sourceCoords={creatingEdge.sourceNode.getEdgeSourceCoords()}
                                currentHeadLocationCoords={creatingEdge.currentHeadLocationCoords} /> : null}</g>
                </svg>
            </div>
        );
    }
}
