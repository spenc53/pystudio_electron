import React from 'react';
import App from '../windows/project/App';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';
import OpenView from '../windows/open/OpenView';
import LoadingView from '../windows/loading/LoadingView';


class ViewManager extends React.Component {
    static Views(): any {
        return {
            main: <App/>,
            open: <OpenView/>,
            loading: <LoadingView/>
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
                <Route path='/' component={ViewManager.View}/>
            </Router>
        );
    }
}

export default ViewManager;