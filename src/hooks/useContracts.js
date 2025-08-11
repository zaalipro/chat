import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WEBSITE_CONTRACTS } from '../queries';
import { processContractsForCurrentSession } from '../utils';

export const useContracts = (websiteId) => {
  const [contracts, setContracts] = useState([]);
  const [processing, setProcessing] = useState(true);
  const [loadComplete, setLoadComplete] = useState(false);

  // Fetch contracts
  const { data, loading, error } = useQuery(GET_WEBSITE_CONTRACTS, {
    variables: { websiteId },
    skip: !websiteId,
    fetchPolicy: 'cache-and-network'
  });

  // Process contracts
  useEffect(() => {
    const processContracts = async () => {
      try {
        console.log('Processing contracts...');
        setProcessing(true);

        if (data?.website?.contracts && Array.isArray(data.website.contracts)) {
          const all = data.website.contracts;
          console.log('Raw contracts:', all);

          if (all.length === 0) {
            console.log('No contracts from API');
            setContracts([]);
            return;
          }

          try {
            // Try session filtering
            const session = await processContractsForCurrentSession(all);
            console.log(`Session result: ${session.length} contracts`);

            if (session.length > 0) {
              console.log('Using session contracts:', session);
              setContracts(session);
            } else {
              // Fallback to all contracts
              console.log('Using all contracts as fallback');
              setContracts(all);
            }
          } catch (sessionError) {
            console.error('Session filtering failed, using all:', sessionError);
            setContracts(all);
          }
        } else {
          console.log('No valid contracts data');
          setContracts([]);
        }
      } catch (err) {
        console.error('Contract processing failed:', err);
        setContracts([]);
        throw err;
      } finally {
        console.log('Contract processing complete');
        setProcessing(false);
        setLoadComplete(true);
      }
    };

    if (data && !loading) {
      console.log('Contracts data available');
      processContracts();
    } else if (!loading && !data) {
      console.log('No data, setting complete');
      setProcessing(false);
      setLoadComplete(true);
    }
  }, [data, loading]);

  return {
    contracts,
    loading,
    error,
    processing,
    loadComplete
  };
};