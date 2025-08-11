// Chat utility functions with simple names
export const createActiveChat = (chat) => ({
  id: chat.id,
  status: chat.status,
  customerName: chat.customerName,
  headline: chat.headline,
  ipAddress: chat.ipAddress
});

export const resetChatState = (setState, setRef) => {
  setState(new Set());
  if (setRef?.current) {
    setRef.current = new Set();
  }
};

export const processResults = (results, contracts) => {
  const success = [];
  const failed = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      success.push({
        ...result.value.chat,
        contract: result.value.contract
      });
    } else {
      failed.push({
        contract: contracts[index],
        error: result.reason || result.value?.error
      });
    }
  });
  
  return { success, failed };
};

export const logChatCreation = (success, failed) => {
  console.log(`Chat creation: ${success.length} success, ${failed.length} failed`);
  if (failed.length > 0) {
    console.warn('Failed chats:', failed);
  }
};