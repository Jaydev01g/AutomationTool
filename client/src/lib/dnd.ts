// This file contains drag and drop utilities for the test builder

/**
 * Helper function to handle drag start events
 */
export const handleDragStart = (e: React.DragEvent, data: any, type: string) => {
  // Set data type and payload
  e.dataTransfer.setData('application/json', JSON.stringify({
    type,
    data
  }));
  
  // Add visual feedback
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.add('opacity-50');
  }
};

/**
 * Helper function to handle drag end events
 */
export const handleDragEnd = (e: React.DragEvent) => {
  // Remove visual feedback
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.remove('opacity-50');
  }
};

/**
 * Helper function to handle drag over events
 */
export const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  
  // Add visual feedback for drop target
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
  }
};

/**
 * Helper function to handle drag leave events
 */
export const handleDragLeave = (e: React.DragEvent) => {
  // Remove visual feedback for drop target
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
  }
};

/**
 * Helper function to handle drop events
 */
export const handleDrop = (e: React.DragEvent, onDrop: (data: any, type: string) => void) => {
  e.preventDefault();
  
  // Remove visual feedback for drop target
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
  }
  
  // Extract and process the dropped data
  const jsonData = e.dataTransfer.getData('application/json');
  if (jsonData) {
    try {
      const { type, data } = JSON.parse(jsonData);
      onDrop(data, type);
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};
