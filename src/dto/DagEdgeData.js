
export default class DagEdgeData {
    constructor({ id, sourceNode, targetNode }) {
        this.data = { id: (id || Date.now()), sourceNode, targetNode }

        console.log("new edge data; ", this.data)
    }

    get id(){return this.data.id}
    get sourceNode(){return this.data.sourceNode}
    get targetNode(){return this.data.targetNode}
    serialize() {
        return JSON.stringify(this);
    }
}
