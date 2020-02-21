import React from 'react';

export type JsonViewerProps = {
    data: any
}

const padding = 20;

class JsonViewer extends React.Component<JsonViewerProps> {
    render() {
        const { data } = this.props;
        return(
            <div style={{paddingTop:'20px', paddingBottom:'20px'}}>
                {Object.keys(data).map((key: string, index: number) => {
                    return (
                        <div>
                            <JsonNode key={index} jsonKey={key} data={data[key]} level={0}></JsonNode>
                        </div>
                    )
                })}
            </div>
        )
    }

}

type JsonNodeProps = {
    jsonKey?: string
    data: any;
    level: number;
}

class JsonNode extends React.Component<JsonNodeProps> {

    state: {
        isDisplayed: boolean;
    }

    constructor(props: JsonNodeProps) {
        super(props);
        
        this.state = {
            isDisplayed: false
        }

        this.toggleDisplayed = this.toggleDisplayed.bind(this);
    }

    toggleDisplayed(): void {
        this.setState({
            isDisplayed: !this.state.isDisplayed
        });
    }

    render() {
        const { jsonKey: key, data, level } = this.props;

        // key == key
        // data could be array, string, number, etc
        const type = typeof(data);

        if (type === 'string' || type === 'number') {
            return (
                <div style={{paddingLeft:(padding).toString() + 'px'}}>
                    <span style={{paddingRight:"10px"}}>"{key}":</span>
                    <JsonElement data={data}></JsonElement>
                </div>
            );
        }

        if (Array.isArray(data)) {
            return (
                <div style={{paddingLeft:(padding).toString() + 'px',}}>
                    <span onClick={this.toggleDisplayed} style={{paddingRight:"10px"}}>"{key}":</span>[
                    { (!this.state.isDisplayed) ? <span onClick={this.toggleDisplayed}>...</span> : <JsonArray data={data} level={level + 1}></JsonArray>}
                    ]
                </div>
            );
        }

        return (
            <div style={{paddingLeft:(padding).toString() + 'px'}}>
                <span onClick={this.toggleDisplayed} style={{paddingRight:"10px"}}>"{key}":</span>{'{'}
                    { (!this.state.isDisplayed) ? <span onClick={this.toggleDisplayed}>{'...'}</span> : Object.keys(data).map((key1: string, index: number) => {
                    return (
                        <div key={level.toString() + index} style={{paddingLeft:(padding).toString() + 'px'}}>
                            <JsonNode 
                                jsonKey={key1} 
                                key={level.toString() + index} 
                                data={data[key1]} 
                                level={level + 1}
                            ></JsonNode>
                        </div>
                    )
                })}
                {'}'}
            </div>
        );
    }
}

// data is an array
type JsonArrayProps = {
    level: number;
    data: any[]
}
class JsonArray extends React.Component<JsonArrayProps> {
    state: {
        isDisplayed: boolean;
    }

    constructor(props: JsonArrayProps) {
        super(props);
    
        this.state = {
            isDisplayed: true
        }

        this.toggleDisplayed = this.toggleDisplayed.bind(this);
    }

    toggleDisplayed(): void {
        this.setState({
            isDisplayed: !this.state.isDisplayed
        });
    }

    render() {

        const { data, level } = this.props;

        // we have an array as our data
        if (data.length === 0) {
            return (
                <span>[]</span>
            )
        }

        return (
            data.map((dat: any, index: number) => {
                const type = typeof(dat);

                if (type === 'string' || type === 'number') {
                    return (
                        <div style={{paddingLeft:(padding).toString() + 'px'}}>
                            <JsonElement data={dat}></JsonElement>
                        </div>
                    );
                }
                
                if (Array.isArray(dat)) {
                    return (
                        <div>
                            <span onClick={this.toggleDisplayed} style={{paddingLeft:(padding).toString() + 'px'}}>[</span>
                                { (!this.state.isDisplayed) ? <span onClick={this.toggleDisplayed}>...</span> : <JsonArray data={dat} level={level + 1}></JsonArray>}
                            <span style={{paddingLeft: !this.state.isDisplayed ? '0' : (padding).toString() + 'px'}}>]</span>
                        </div>
                    );
                }

                // json objects here can be collaspse able, so, we gotta make them as such, will need a new class
                return (
                    <JsonObject data={dat} level={level}></JsonObject>
                )
        }));
    }
}

type JsonObjectProps = {
    data: any;
    level: number
}
class JsonObject extends React.Component<JsonObjectProps> {
    state: {
        isDisplayed: boolean;
    }

    constructor(props: JsonObjectProps) {
        super(props)

        this.state = {
            isDisplayed: false
        }

        this.toggleDisplayed = this.toggleDisplayed.bind(this);
    }

    toggleDisplayed() {
        this.setState({
            isDisplayed: !this.state.isDisplayed
        });
    }

    render() {
        const { data, level } = this.props;

        return (
            <div style={{paddingLeft:(padding).toString() + 'px'}}>
                <span onClick={this.toggleDisplayed}>{'{'}</span>
                    { (!this.state.isDisplayed) ? <span onClick={this.toggleDisplayed}>{'...'}</span> : Object.keys(data).map((key: string, index: number) => {
                        return (
                            <div>
                                <JsonNode key={index} jsonKey={key} data={data[key]} level={level}></JsonNode>
                            </div>
                        );
                    })}
                {'}'}
            </div>
        )
    }

}

// data is a string or number
type JsonElementProps = {
    data: string | number | any
}
class JsonElement extends React.Component<JsonElementProps> {
    render() {
        // different wrappers
        const { data } = this.props;
        const type = typeof(data);
        let dat = "";

        if (type === 'string') {
            dat = '"' + data + '"';
        } else if (type === 'number') {
            dat = data;
        } else {
            dat = JSON.stringify(data);
        }
    
        return (
            <span>{dat}</span>
        );
    }
}

export default JsonViewer;