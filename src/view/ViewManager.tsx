import React from 'react';
import App from '../App';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';


class ViewManager extends React.Component {
    static Views(): any {
        return {
            main: <App/>,
            // other view
        }
    }

    static View(props: any) {
        let name = props.location.search.substr(1);
        let view = ViewManager.Views()[name];
        if(view == null) { 
            throw new Error('View "' + name + '" is undefined');
        }
        return view;
    }

    render() {
        return (
            <Router>
                <div>
                    <Route path='/' component={ViewManager.View}/>
                </div>
            </Router>
        );
    }
}

export default ViewManager;