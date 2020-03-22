import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Tab.css';

class Tab extends Component {
  static propTypes = {
    activeTab: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    onClose: PropTypes.func
  };

  onClick = () => {
    const { label, onClick } = this.props;
    onClick(label);
  }

  render() {
    const {
      onClick,
      props: {
        activeTab,
        label,
      },
    } = this;


    let className = 'tab-list-item';

    if (activeTab === label) {
      className += ' tab-list-active';
    } else {
      className += ' tab-list-inactive';
    }

    return (
      <li
        className={className}
        onClick={onClick}
      >
        <div style={{display:'flex', flexDirection:'row'}}>
          {/* // TODO: Show if the tab needs to be saved */}

          <div>{label}</div>
          
          { this.props.onClose !== undefined ?
            <div className='tabExit' style={{marginLeft:'5px'}} onClick={() => {this.props.onClose(); this.props.onClosed();}}>
              x
            </div> :
            null}
        </div>
      </li>
    );
  }
}

export default Tab;