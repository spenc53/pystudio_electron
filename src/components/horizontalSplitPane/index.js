import React from "react";
import './split.css';

const splitPaneContext = React.createContext();

export default function HorizontalSplitPane({ children, ...props }) {
  const [leftWidth, setLeftWidth] = React.useState(null);
  const separatorXPosition = React.useRef(null);

  const splitPaneRef = React.createRef();

  const onMouseDown = e => {
    separatorXPosition.current = e.clientX;
  };

  const onMouseMove = e => {
    if (!separatorXPosition.current) {
      return;
    }

    const newTopHeight = leftWidth + e.clientX - separatorXPosition.current;
    separatorXPosition.current = e.clientX;

    setLeftWidth(newTopHeight);
  };

  const onMouseUp = () => {
    separatorXPosition.current = null;
    window.dispatchEvent(new Event('resize'));
  };

  React.useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  return (
    <div {...props} className="split-pane-width" ref={splitPaneRef}>
      <splitPaneContext.Provider value={{ leftWidth, setLeftWidth }}>
        {children[0]}
        <div className="separator-width" onMouseDown={onMouseDown} />
        {children[1]}
      </splitPaneContext.Provider>
    </div>
  );
}

HorizontalSplitPane.Left = function SplitPaneLeft(props) {
  const leftRef = React.createRef();
  const { leftWidth, setLeftWidth } = React.useContext(splitPaneContext);

  React.useEffect(() => {
    if (!leftWidth) {
        setLeftWidth(leftRef.current.clientWidth);
      leftRef.current.style.flex = "none";
      return;
    }

    leftRef.current.style.width = `${leftWidth}px`;
  }, [leftWidth]);

  return <div {...props} className="split-pane-left" ref={leftRef} />;
};

HorizontalSplitPane.Right = function SplitPaneRight(props) {
  return <div {...props} className="split-pane-right" />;
};
