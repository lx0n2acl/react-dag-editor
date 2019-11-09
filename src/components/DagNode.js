
import React, { Component } from 'react'
import ReactDom from 'react-dom'
import * as d3 from 'd3';
import * as d3dag from 'd3-dag';

export default class DagNode extends React.Component {
    constructor(props) {
        super(props);

        console.log(props)
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
        const { id, title, layer, coords: {x, y}, width, height,
            selected, dragNode, dragNewEdge, onTextSubmit, setHoverNode } = this.props;


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
                    width={width}
                    height={height}
                    rx={10}
                    ry={10}
                    fill={selected ? "#003366" : "#aabbcc"}
                />
                <g>
                    <foreignObject x="10" y="10" width={width - 10} height={height / 2} visibility={this.state.editMode ? "visible" : "hidden"}>
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
                <circle cx={width / 2} cy={height} r="10"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        dragNewEdge()
                    }} />
            </g>

        );
    }
}
