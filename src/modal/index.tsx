import React from 'react';
import './modal.css';

export type ModalProps = {
    show: boolean,
    onClick: Function
}

class Modal extends React.Component<ModalProps> {

    // constructor(props: ModalProps) {
    //     super(props);
    // }

    render() {
        return (
            <div style={{display: this.props.show ? '' : 'None'}} className='modal'>
                <div className='modal-body'>
                    {this.props.children}
                </div>
                <div className='modal-background' onClick={() => this.props.onClick()}></div>
            </div>
        );
    }
}

export default Modal;