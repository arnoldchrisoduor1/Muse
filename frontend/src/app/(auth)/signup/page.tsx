import SignUp from '@/components/SignUp'
import React from 'react'

const page = () => {
  return (
    <>
      <div className='w-[95%] mx-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
        <SignUp />
      </div>
    </>
  )
}

export default page