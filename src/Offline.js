import React from 'react'

const Offline = () => (
<span>
    <div
    style={{backgroundColor: 'rgba(39,175,96,1)'}}
    className='header header-padding header-shadow'
    >
        <div className='conversation-header gutter-left'>
            <h3 className='fadeInLeft'>Offline</h3>
            <p className='text-opaque fadeInLeft'>TeamViewer</p>
        </div>
    </div>
    <div className='body overflow-y-scroll overflow-x-hidden'>
    Customer Support is offline
    </div>
</span>
)

export default Offline