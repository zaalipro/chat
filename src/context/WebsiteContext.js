import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WEBSITE_CONTRACTS } from '../queries';
import store from 'store2';
import Offline from '../Offline';

const WebsiteContext = createContext({});

export const useWebsite = () => useContext(WebsiteContext);

export const WebsiteProvider = ({ websiteId, children }) => {
  const [website, setWebsite] = useState(() => store.get('website'));

  const { data, error, loading } = useQuery(GET_WEBSITE_CONTRACTS, {
    variables: { websiteId },
    skip: !websiteId,
  });

  useEffect(() => {
    if (data?.website) {
      store.set('website', data.website);
      setWebsite(data.website);
    }
  }, [data?.website]);

  if (loading) {
    return null; // Or a loading spinner
  }

  if (error) {
    console.error('Error fetching website contracts:', error);
    return <Offline />;
  }

  if (!website?.contracts || website.contracts.length === 0) {
    console.warn('No active contracts found for website');
    return <Offline />;
  }

  return (
    <WebsiteContext.Provider value={{ website }}>
      {children}
    </WebsiteContext.Provider>
  );
};