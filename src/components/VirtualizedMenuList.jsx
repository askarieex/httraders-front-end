// src/components/VirtualizedMenuList.jsx

import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { components } from 'react-select';
import PropTypes from 'prop-types';

const VirtualizedMenuList = (props) => {
  const { options, children, maxHeight, getValue } = props;
  const height = 60; // Height of each option
  const selected = getValue();
  const initialOffset = selected.length > 0 ? options.indexOf(selected[0]) * height : 0;

  const Row = ({ index, style }) => (
    <div style={style}>
      {children[index]}
    </div>
  );

  return (
    <components.MenuList {...props}>
      <List
        height={Math.min(maxHeight, options.length * height)}
        itemCount={children.length}
        itemSize={height}
        initialScrollOffset={initialOffset}
        width="100%"
      >
        {Row}
      </List>
    </components.MenuList>
  );
};

VirtualizedMenuList.propTypes = {
  options: PropTypes.array.isRequired,
  children: PropTypes.array.isRequired,
  maxHeight: PropTypes.number.isRequired,
  getValue: PropTypes.func.isRequired,
};

export default VirtualizedMenuList;
