import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Tabs.css';
import Tab from './Tab';

class Tabs extends Component {

  constructor(props) {
    super(props);
    
    let children = React.Children.toArray(this.props.children)
    this.state = {
      activeTab: children[0]?.props.label,
    };

    this.onClosed = this.onClosed.bind(this);
  }

  onClickTabItem = (tab) => {
    this.setState({ activeTab: tab });
  }

  onClosed() {
    // this.setState({
    //   activeTab: React.Children.toArray(this.props.children)[0].props.label
    // })
  }

  render() {
    let {
      onClickTabItem,
      state: {
        activeTab,
      }
    } = this;

    const children = React.Children.toArray(this.props.children);

    if (children.length > 0 && children.findIndex((child) => {return child.props.label == activeTab }) < 0) {
      this.state = {
        activeTab: children[0].props.label
      };
      activeTab = this.state.activeTab;
    }
    return (
      
      <div style={{flexDirection: 'column', display: 'flex', height: '100%'}}>
        <div>
          <ol className="tab-list">
            {children.map((child) => {
              const { label, onClose, changedSubject } = child.props;
              return (
                <Tab
                  activeTab={activeTab}
                  key={'TAB_' + label}
                  label={label}
                  onClick={onClickTabItem}
                  onClose={onClose}
                  onClosed={this.onClosed}
                  changedSubject={changedSubject}
                />
              );
            })}
          </ol>
        </div>
        <div className="tab-content">
          {children.map((child) => {
            return (
                <div key={child.key} style={{display: child.props.label !== activeTab ? 'none' : 'flex', height:'100%', flexDirection:'column'}}>
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