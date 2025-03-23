"use client";
import SignUp from '@/components/SignUp'
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const Page = () => {

  const { user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
        if(user.isAuthenticated) {
          router.push('/feed');
        }
      }, [user.isAuthenticated, router]);
  return (
    <>
      <div className='w-[95%] mx-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
        <SignUp />
      </div>
    </>
  )
}

export default Page;