import Image from "next/image";
import Profile from "../../public/images/profile.png";

const Comments = ({username, content}) => {
  return (
    <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-5 ml-3 mt-2">
              <div className="rounded-full">
                <Image
                  src={Profile}
                  width={30}
                  height={30}
                  alt="Picture of the author"
                  className="rounded-full"
                />
              </div>
              <div>
                <p className="text-sm">{username}</p>
                <p className="text-xs text-gray">{content}</p>
              </div>
            </div>
            <div className="text-gray text-end text-sm">Now</div>
          </div>
  )
}

export default Comments