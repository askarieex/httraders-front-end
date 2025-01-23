// CustomOption.jsx

import React from 'react';
import { components } from 'react-select';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import './css/CustomOption.css'; // Optional: If you have additional styles

const CustomOption = (props) => {
  const { data, isFocused, isSelected } = props;
  let StockBadge = null;

  if (data.availableStock > 10) {
    StockBadge = (
      <span className="option-stock stock-in">
        <FaCheckCircle /> In Stock
      </span>
    );
  } else if (data.availableStock > 0) {
    StockBadge = (
      <span className="option-stock stock-low">
        <FaExclamationTriangle /> Low Stock
      </span>
    );
  } else {
    StockBadge = (
      <span className="option-stock stock-out">
        <FaTimesCircle /> Out of Stock
      </span>
    );
  }

  return (
    <components.Option 
      {...props} 
      className={`custom-option ${isFocused ? 'focused' : ''} ${isSelected ? 'selected' : ''}`}
    >
      <div className="option-main">
        <span>{data.label}</span>
        {StockBadge}
      </div>
      <div className="option-details">
        <span>Category: {data.category}</span>
        <span>Available: {data.availableStock} {data.unit}</span>
      </div>
    </components.Option>
  );
};

CustomOption.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    category: PropTypes.string,
    availableStock: PropTypes.number,
    unit: PropTypes.string,
  }).isRequired,
  isFocused: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

export default CustomOption;
