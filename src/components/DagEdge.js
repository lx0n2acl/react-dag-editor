import React, { Component } from 'react'
import ReactDom from 'react-dom'
import * as d3 from 'd3';

const DagEdge = ({ sourceCoords, targetCoords, currentHeadLocationCoords }) => {
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

export default DagEdge;
