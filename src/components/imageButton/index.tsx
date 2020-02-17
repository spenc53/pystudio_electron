import React, { CSSProperties } from 'react';

export type ImageButtonTypes = {
    disabled: boolean;
    style?: CSSProperties;
    onClick: () => void;
}

class ImageButton extends React.Component<ImageButtonTypes> {
    public static defaultProps: ImageButtonTypes = {
        disabled: false,
        onClick: () => {}
    }

    myRef: any;
    
    constructor(props: ImageButtonTypes) {
        super(props);

        this.onMouseOver = this.onMouseOver.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

        this.myRef = React.createRef();
        
        console.log('new Image button');
    }

    componentDidUpdate() {
        if (this.props.disabled && this.myRef) {
            this.myRef.current.style.backgroundColor = "";
            this.myRef.current.style.opacity = "1";
        }
    }

    onMouseOver(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (this.props.disabled) return;
        e.currentTarget.style.background = "grey";
        e.currentTarget.style.opacity=".5";
    }

    onMouseLeave(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.currentTarget.style.backgroundColor = "";
        e.currentTarget.style.opacity="1";
    }

    render() {
        return (
            <div ref={this.myRef} style={this.props.style} onMouseOver={this.onMouseOver} onMouseLeave={this.onMouseLeave} onClick={() => {if (this.props.disabled) return; this.props.onClick()}}>
                {this.props.children}
            </div>
        );
    }
}

export default ImageButton