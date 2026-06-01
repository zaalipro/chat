// Chat and Contract Status Enum Constants
// These constants ensure consistency when working with status values
// that are now returned as enums from the GraphQL backend

export const CHAT_STATUS = {
  ACTIVE: 'ACTIVE',
  STARTED: 'STARTED',
  FINISHED: 'FINISHED',
  MISSED: 'MISSED'
};

export const CONTRACT_STATUS = {
  ACTIVE: 'active'
};

// Helper function to get display-friendly status text
export const getDisplayStatus = (enumStatus) => {
  const statusMap = {
    'STARTED': 'Started',
    'FINISHED': 'Finished',
    'ACTIVE': 'Active',
    'MISSED': 'Missed'
  };
  return statusMap[enumStatus] || 'Started';
};
