import { 
  Header, 
  HeaderPadding, 
  ConversationHeader, 
  TextOpaque,
  OverflowYScroll,
  OverflowXHidden
} from './components/styled/App';

const Offline = () => (
<span>
    <Header style={{backgroundColor: 'rgba(39,175,96,1)'}} className='header-shadow'>
      <HeaderPadding>
        <ConversationHeader className='gutter-left'>
          <h3 className='fadeInLeft'>Offline</h3>
          <TextOpaque className='fadeInLeft'>TeamViewer</TextOpaque>
        </ConversationHeader>
      </HeaderPadding>
    </Header>
    <div className='body'>
      <OverflowYScroll>
        <OverflowXHidden>
          Customer Support is offline
        </OverflowXHidden>
      </OverflowYScroll>
    </div>
</span>
)

export default Offline