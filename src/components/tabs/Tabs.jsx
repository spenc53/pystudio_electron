import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Tabs.css';
import Tab from './Tab';

class Tabs extends Component {

  constructor(props) {
    super(props);
    
    let children = React.Children.toArray(this.props.children)
    this.state = {
      activeTab: children[0].props.label,
    };
  }

  onClickTabItem = (tab) => {
    this.setState({ activeTab: tab });
  }

  render() {
    const {
      onClickTabItem,
      state: {
        activeTab,
      }
    } = this;

    const children = React.Children.toArray(this.props.children);

    return (
      <div style={{flexDirection: 'column', display: 'flex', height: '100%'}}>
        <div>
          <ol className="tab-list">
            {children.map((child) => {
              const { label } = child.props;

              return (
                <Tab
                  activeTab={activeTab}
                  key={label}
                  label={label}
                  onClick={onClickTabItem}
                />
              );
            })}
          </ol>
        </div>
        <div className="tab-content">
          {children.map((child, index) => {
            return (
                <div key={index} style={{display: child.props.label !== activeTab ? 'none' : 'flex', height:'100%', flexDirection:'column'}}>
                    {child}
                </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Tabs;