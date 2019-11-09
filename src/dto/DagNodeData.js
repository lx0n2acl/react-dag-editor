
export default class DagNodeData {
    constructor({ id, title, layer, x, y }) {
        this.data = { id: (id || Date.now()), title: (title || "Your title here..."), layer, x, y }
        console.log(this.data)
        this.width = 200;
        this.height = 50;
    }

    get id() { return this.data.id }
    get title() { return this.data.title; }
    get layer() { return this.data.layer; }

    set coords({x,y}){
        this.data.x = x; 
        this.data.y=y;
    }
    get coords() {
        const { x, y } = this.data;
        return { x, y }
    }

    get edgeSourceCoords() { return { x: this.data.x + (this.width / 2), y: this.data.y + this.height } }
    get edgeTargetCoords() { return { x: this.data.x + (this.width / 2), y: this.data.y } }

    serialize() {
        return JSON.stringify(this.data);
    }
}
