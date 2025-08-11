import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_CHAT } from '../queries';
import { detectIPAddress } from '../utils';
import { processResults, logChatCreation } from '../utils/chatUtils';

export const useChatCreation = () => {
  const [creating, setCreating] = useState(false);
  const [createChat] = useMutation(CREATE_CHAT);

  const createSingle = async (contract, form, ipAddress) => {
    const key = crypto.randomUUID();
    
    const response = await createChat({
      variables: {
        customerName: form.customerName,
        headline: form.headline,
        contractId: contract.id,
        ipAddress,
        key
      }
    });

    return response.data.createChat.chat;
  };

  const createMultiple = async (contracts, form, ipAddress) => {
    const key = crypto.randomUUID();
    
    const promises = contracts.map(contract =>
      createChat({
        variables: {
          customerName: form.customerName,
          headline: form.headline,
          contractId: contract.id,
          ipAddress,
          key
        }
      }).then(response => ({
        success: true,
        chat: response.data.createChat.chat,
        contract
      })).catch(error => ({
        success: false,
        error,
        contract
      }))
    );

    return Promise.allSettled(promises);
  };

  const createChats = async (contracts, form) => {
    try {
      setCreating(true);
      
      // Get IP address
      const ip = await detectIPAddress();
      console.log(`Creating ${contracts.length} chats`);

      if (contracts.length === 1) {
        // Single chat
        const chat = await createSingle(contracts[0], form, ip);
        return {
          success: [{
            ...chat,
            contract: contracts[0]
          }],
          failed: []
        };
      } else {
        // Multiple chats
        const results = await createMultiple(contracts, form, ip);
        const processed = processResults(results, contracts);
        logChatCreation(processed.success, processed.failed);
        return processed;
      }
    } finally {
      setCreating(false);
    }
  };

  return {
    createChats,
    creating
  };
};