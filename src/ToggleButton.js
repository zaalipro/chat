import { Component} from 'react'
import cx from 'classnames'
import { Button } from './components/styled/App'

class ToggleButton extends Component {

  render() {

    const buttonStyles = cx('drop-shadow-hover pointer flex-center flex', {
      'drop-shadow-hover-active': this.props.isOpen
    })

    return (
      <Button
        style={{backgroundColor: this.props.mainColor}}
        className={buttonStyles}
        onClick={() => this.props.togglePanel()}
      >
        <i className='material-icons'>{this.props.isOpen ? 'close' : 'chat_bubble'}</i>
      </Button>
    )

  }

}

export default ToggleButton
