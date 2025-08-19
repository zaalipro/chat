import React from 'react'
import store from 'store2'
import styled from 'styled-components'
import { theme } from './Components/styled/design-system/theme'

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.primary};
  box-shadow: ${theme.shadows.header};
  min-height: 60px;
  transition: box-shadow ${theme.transitions.normal};

  &:hover {
    box-shadow: ${theme.shadows.hoverActive};
  }
`

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${theme.radius.circle};
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  color: ${theme.colors.white};

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  .material-icons {
    font-size: 24px;
  }
`

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  padding: 0 ${theme.spacing.md};
`

const CompanyLogo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: ${theme.radius.md};
  object-fit: contain;
  background-color: ${theme.colors.white};
  padding: 4px;
`

const CompanyDetails = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${theme.spacing.md};
  color: ${theme.colors.white};
  text-align: left;
  overflow: hidden;
`

const CompanyName = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.lg};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
`

const StatusText = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  opacity: 0.8;
  font-weight: 400;
`

const ChatHeader = ({ endChat = () => Promise.resolve(), companyName = "Company Name", status = "Started" }) => {
  const companyLogoURL = import.meta.env.VITE_COMPANY_LOGO_URL

  const handleEndChat = async () => {
    try {
      await endChat()
      store.remove('activeChat')
    } catch (error) {
      console.error('Error ending chat:', error)
    }
  }

  return (
    <HeaderContainer>
      <HeaderButton aria-label="Back">
        <i className='material-icons'>keyboard_arrow_left</i>
      </HeaderButton>
      
      <CompanyInfo>
        <CompanyLogo 
          src={companyLogoURL} 
          alt={`${companyName} logo`}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.marginLeft = '0'
          }}
        />
        <CompanyDetails>
          <CompanyName title={companyName}>{companyName}</CompanyName>
          <StatusText>{status}</StatusText>
        </CompanyDetails>
      </CompanyInfo>
      
      <HeaderButton aria-label="End chat" onClick={handleEndChat}>
        <i className='material-icons'>clear</i>
      </HeaderButton>
    </HeaderContainer>
  )
}

export default ChatHeader
