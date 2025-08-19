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
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="36"
          height="36"
          viewBox="0 0 640 640"
          fill="currentColor"
        >
          <path d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C221.6 240.4 221.6 255.6 231 264.9L286 319.9L231 374.9C221.6 384.3 221.6 399.5 231 408.8C240.4 418.1 255.6 418.2 264.9 408.8L319.9 353.8L374.9 408.8C384.3 418.2 399.5 418.2 408.8 408.8C418.1 399.4 418.2 384.2 408.8 374.9L353.8 319.9L408.8 264.9C418.2 255.5 418.2 240.3 408.8 231C399.4 221.7 384.2 221.6 374.9 231L319.9 286L264.9 231C255.5 221.6 240.3 221.6 231 231z"/>
        </svg>
      </HeaderButton>
    </HeaderContainer>
  )
}

export default ChatHeader
