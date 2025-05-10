import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCut, FaTimes, FaInfoCircle, FaCheck, FaPlus } from "react-icons/fa";
import { DIMENSION_UNITS } from "../config/units";
import "./css/CutModal.css";

const CutModal = ({ item, onClose, onCutComplete }) => {
  // State for target dimensions
  const [targetDims, setTargetDims] = useState({
    length: "",
    breadth: "",
    height: "",
  });

  const [dimUnit, setDimUnit] = useState(item?.dim_unit || "ft");
  const [pieces, setPieces] = useState(1);
  const [createOffcut, setCreateOffcut] = useState(true);

  // State for calculation results
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Automatically calculate when dimensions change
  useEffect(() => {
    const calculateCut = async () => {
      // Only calculate if all required dimensions are provided
      if (!targetDims.length || !targetDims.breadth || !targetDims.height) {
        setCalculation(null);
        return;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:3000/api/cut/calculate",
          {
            itemId: item.id,
            targetDims,
            dim_unit: dimUnit,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCalculation(response.data);
      } catch (err) {
        console.error("Error calculating cut:", err);
        setError(
          err.response?.data?.message ||
            "Failed to calculate cut possibilities. Please try again."
        );
        setCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce the calculation to avoid too many requests
    const timer = setTimeout(() => {
      calculateCut();
    }, 500);

    return () => clearTimeout(timer);
  }, [targetDims, dimUnit, item.id]);

  // Handle dimension input changes
  const handleDimChange = (e) => {
    const { name, value } = e.target;
    setTargetDims((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle cut submission
  const handleCutSubmit = async (e) => {
    e.preventDefault();

    if (!calculation) {
      setError("Please enter valid dimensions first");
      return;
    }

    if (pieces <= 0 || pieces > calculation.maxPieces) {
      setError(
        `Number of pieces must be between 1 and ${calculation.maxPieces}`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3000/api/cut/item",
        {
          itemId: item.id,
          targetDims,
          pieces,
          createOffcut,
          dim_unit: dimUnit,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Cut operation completed successfully!");

      // Call the parent's callback with the updated data
      if (onCutComplete) {
        onCutComplete(response.data);
      }

      // Close the modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error performing cut:", err);
      setError(
        err.response?.data?.message ||
          "Failed to perform cut operation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container cut-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <FaCut className="modal-icon" /> Cut/Bill {item.name}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="source-item-info">
            <h4>Source Item</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{item.name}</span>
              </div>
              <div className="info-item">
                <label>Dimensions:</label>
                <span>{item.dimension || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Unit:</label>
                <span>{item.unit}</span>
              </div>
              <div className="info-item">
                <label>Available Quantity:</label>
                <span>
                  {item.quantity} {item.unit}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleCutSubmit} className="cut-form">
            <div className="form-section">
              <h4 className="form-section-title">Target Dimensions</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Dimension Unit</label>
                  <select
                    className="form-control"
                    value={dimUnit}
                    onChange={(e) => setDimUnit(e.target.value)}
                  >
                    {DIMENSION_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dimensions-inputs">
                <div className="form-group">
                  <label>
                    Length ({dimUnit}) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="length"
                    value={targetDims.length}
                    onChange={handleDimChange}
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Breadth ({dimUnit}) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="breadth"
                    value={targetDims.breadth}
                    onChange={handleDimChange}
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Height ({dimUnit}) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="height"
                    value={targetDims.height}
                    onChange={handleDimChange}
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
              </div>
            </div>

            {isCalculating ? (
              <div className="calculation-loading">
                <div className="spinner"></div>
                <p>Calculating possible cuts...</p>
              </div>
            ) : calculation ? (
              <div className="calculation-results">
                <h4>Calculation Results</h4>
                <div className="results-grid">
                  <div className="result-item">
                    <label>Maximum Pieces:</label>
                    <span className="highlight">{calculation.maxPieces}</span>
                  </div>
                  <div className="result-item">
                    <label>Target Dimensions:</label>
                    <span>{calculation.targetDimensions}</span>
                  </div>
                  <div className="result-item">
                    <label>Volume per Piece:</label>
                    <span>
                      {(
                        calculation.consumedVolume / calculation.maxPieces
                      ).toFixed(2)}{" "}
                      {item.unit}
                    </span>
                  </div>
                </div>

                <div className="form-section mt-4">
                  <h4 className="form-section-title">Cutting Options</h4>
                  <div className="form-group">
                    <label>
                      Number of Pieces to Cut{" "}
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={pieces}
                      onChange={(e) =>
                        setPieces(
                          Math.min(
                            parseInt(e.target.value) || 0,
                            calculation.maxPieces
                          )
                        )
                      }
                      min="1"
                      max={calculation.maxPieces}
                      required
                    />
                    <small className="form-text-muted">
                      Maximum: {calculation.maxPieces} pieces
                    </small>
                  </div>

                  {calculation.leftoverVolume > 0 && (
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={createOffcut}
                          onChange={(e) => setCreateOffcut(e.target.checked)}
                        />
                        Create offcut item with leftover material
                      </label>
                    </div>
                  )}
                </div>

                <div className="cut-summary">
                  <h4>
                    <FaInfoCircle /> Cut Summary
                  </h4>
                  <div className="summary-content">
                    <p>
                      You are about to cut <strong>{pieces}</strong> piece(s) of
                      size <strong>{calculation.targetDimensions}</strong> from{" "}
                      <strong>{item.name}</strong>.
                    </p>
                    <p>
                      This will use{" "}
                      <strong>
                        {(
                          (calculation.consumedVolume / calculation.maxPieces) *
                          pieces
                        ).toFixed(2)}{" "}
                        {item.unit}
                      </strong>{" "}
                      of material.
                    </p>
                    {calculation.leftoverVolume > 0 && (
                      <p>
                        Leftover material:{" "}
                        <strong>
                          {(
                            calculation.leftoverVolume -
                            (calculation.consumedVolume /
                              calculation.maxPieces) *
                              (pieces - calculation.maxPieces)
                          ).toFixed(2)}{" "}
                          {item.unit}
                        </strong>
                        {createOffcut
                          ? " (will be saved as a new offcut item)"
                          : " (will remain in the original item)"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-calculation">
                <p>
                  <FaInfoCircle /> Enter target dimensions to calculate possible
                  cuts
                </p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <FaTimes /> {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <FaCheck /> {success}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={
                  !calculation ||
                  isSubmitting ||
                  pieces <= 0 ||
                  pieces > (calculation?.maxPieces || 0)
                }
              >
                {isSubmitting ? (
                  <span className="loading-text">
                    <span className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FaCut /> Cut Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CutModal;
