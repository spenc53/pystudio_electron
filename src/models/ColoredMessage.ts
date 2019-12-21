class ColoredMessage {
    colors: {
        [key: string]: string
    } = {
        "[0;30": "black",
        "[0;31": "red",
        "[0;32" : "green",
        "[0;33": "yellow",
        "[0;34": "blue",
        "[0;35": "magenta",
        "[0;36": "cyan",
        "[0;37": "white"
    }

    color: string;
    text: string;
    
    constructor(text: string, color?: string) {
        if (color) {
            this.color = color;
            this.text = text;
            return;
        }

        const indexOfM = text.indexOf("m");
        const colorCode = text.substring(0, indexOfM);
        if (colorCode in this.colors) {
            this.color = this.colors[colorCode];
        } else {
            this.color = "black";
        }
         
        this.text = text.substring(indexOfM + 1);
    }

    public getColor(): string {
        return this.color;
    }

    public getText(): string {
        return this.text;
    }
 }

export default ColoredMessage;