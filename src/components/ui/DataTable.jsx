import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ReactPaginate from 'react-paginate';
import { FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';

/**
 * DataTable component for displaying tabular data with sorting, pagination, and search
 * 
 * @param {Object} props Component props
 * @param {Array} props.data Array of data objects to display
 * @param {Array} props.columns Column configuration objects
 * @param {number} props.itemsPerPage Number of items to display per page
 * @param {boolean} props.showSearch Whether to show the search input
 * @param {function} props.onRowClick Function to call when a row is clicked
 * @param {boolean} props.isLoading Whether the data is loading
 * @param {string} props.emptyMessage Message to display when there's no data
 * @returns {ReactElement} The rendered DataTable component
 */
const DataTable = ({
  data = [],
  columns = [],
  itemsPerPage = 10,
  showSearch = true,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available'
}) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Handle sorting of columns
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle pagination change
  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Get sorted and filtered data
  const sortedAndFilteredData = useMemo(() => {
    // Create a copy of the data array
    let filteredData = [...data];

    // Filter data based on search term
    if (searchTerm.trim() !== '') {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.filter((item) => {
        return columns.some((column) => {
          const value = column.accessor ? (typeof column.accessor === 'function' 
            ? column.accessor(item) 
            : item[column.accessor]) : '';
          
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerCaseSearchTerm);
        });
      });
    }

    // Sort data if sortConfig has a key
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const column = columns.find(col => col.accessor === sortConfig.key);
        
        // Get values to compare
        let aValue = column ? (typeof column.accessor === 'function' 
          ? column.accessor(a) 
          : a[column.accessor]) : '';
        
        let bValue = column ? (typeof column.accessor === 'function' 
          ? column.accessor(b) 
          : b[column.accessor]) : '';
          
        // Handle undefined, null or empty values
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';
        
        // Numeric comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // String comparison (convert to string for comparison)
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredData;
  }, [data, columns, sortConfig, searchTerm]);
  
  // Get current items for pagination
  const currentItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return sortedAndFilteredData.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredData, currentPage, itemsPerPage]);
  
  // Calculate total pages
  const pageCount = Math.ceil(sortedAndFilteredData.length / itemsPerPage);
  
  // Get sort indicator for column headers
  const getSortIndicator = (accessor) => {
    if (sortConfig.key !== accessor) return <FaSort size={12} className="ml-1 opacity-40" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp size={12} className="ml-1" /> 
      : <FaSortDown size={12} className="ml-1" />;
  };

  return (
    <div className={`bg-${theme === 'dark' ? 'neutral-800' : 'white'} shadow-md rounded-lg overflow-hidden`}>
      {/* Search Bar */}
      {showSearch && (
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className={`text-${theme === 'dark' ? 'neutral-400' : 'neutral-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className={`
                pl-10 pr-4 py-2 w-full rounded-md 
                ${theme === 'dark' 
                  ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400' 
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500'} 
                border focus:outline-none focus:ring-2 focus:ring-primary-500
              `}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0); // Reset to first page on search
              }}
            />
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-neutral-700' : 'divide-neutral-200'}`}>
          {/* Table Header */}
          <thead className={theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-50'}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header || column.accessor}
                  scope="col"
                  className={`
                    px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                    ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'} 
                    ${column.sortable !== false ? 'cursor-pointer hover:bg-opacity-80' : ''}
                  `}
                  onClick={() => column.sortable !== false && requestSort(column.accessor)}
                >
                  <div className="flex items-center">
                    {column.header || column.accessor}
                    {column.sortable !== false && getSortIndicator(column.accessor)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-neutral-700' : 'divide-neutral-200'}`}>
            {isLoading ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-500'}`}
                >
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-500'} text-center`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentItems.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-opacity-80' : ''}
                    ${theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-50'}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={`${rowIndex}-${colIndex}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}
                    >
                      {column.render 
                        ? column.render(row) 
                        : (typeof column.accessor === 'function' 
                          ? column.accessor(row) 
                          : row[column.accessor]) || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {!isLoading && sortedAndFilteredData.length > itemsPerPage && (
        <div className={`
          px-4 py-3 flex items-center justify-between border-t
          ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}
        `}>
          <div className={`text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
            Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, sortedAndFilteredData.length)} of {sortedAndFilteredData.length} entries
          </div>
          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            breakLabel={'...'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={`flex gap-1`}
            pageClassName={`rounded`}
            pageLinkClassName={`
              block px-3 py-1 rounded text-sm
              ${theme === 'dark' 
                ? 'text-neutral-300 hover:bg-neutral-700' 
                : 'text-neutral-700 hover:bg-neutral-100'}
            `}
            previousClassName={`rounded`}
            previousLinkClassName={`
              block px-3 py-1 rounded text-sm font-medium
              ${theme === 'dark' 
                ? 'text-neutral-300 hover:bg-neutral-700' 
                : 'text-neutral-700 hover:bg-neutral-100'}
            `}
            nextClassName={`rounded`}
            nextLinkClassName={`
              block px-3 py-1 rounded text-sm font-medium
              ${theme === 'dark' 
                ? 'text-neutral-300 hover:bg-neutral-700' 
                : 'text-neutral-700 hover:bg-neutral-100'}
            `}
            breakClassName={`rounded`}
            breakLinkClassName={`
              block px-3 py-1 rounded text-sm
              ${theme === 'dark' 
                ? 'text-neutral-300' 
                : 'text-neutral-700'}
            `}
            activeClassName={`bg-primary-500 text-white`}
            activeLinkClassName={`text-white hover:bg-primary-500`}
            forcePage={currentPage}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable; 