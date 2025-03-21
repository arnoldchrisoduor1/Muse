import Image from "next/image";
import Profile from "../../public/images/profile.png";
import InputComponent from "@/components/InputComponent";
import { Heart, MessageCircleMore } from "lucide-react";
import Comments from "./Comments";


const PoetryComponent = ({  }) => {
  return (
    <div className="w-[95%] mx-auto mt-5">
        <div className="border rounded-sm w-full p-4">
          {/* Top Bar */}
          <div className="flex w-full items-center justify-between border-b border-gray/30 pb-2">
            <div className="flex items-center gap-5">
              <div className="rounded-full">
                <Image
                  src={Profile}
                  width={40}
                  height={40}
                  alt="Picture of the author"
                  className="rounded-full"
                />
              </div>
              <div>
                <p>Test Username</p>
                <p className="text-sm text-gray">Poem</p>
              </div>
            </div>
            <div className="text-gray text-end">5 Mins Ago</div>
          </div>

          {/* Middle part */}
          <div className="my-4 pb-2 border-b border-gray/30">
            <p>
              Now this is the poem,
              <br />A very lovely poem,
              <br />
              That i hope someone comes to love,
              <br />
              Probably some day,
              <br />
              We cant be sure,
              <br />
              Till we try
            </p>
          </div>

          {/* Lower Section */}
          <div>
            <div className="flex justify-between gap-3 items-center">
              <div className="">
                <InputComponent
                  placeholder="comment"
                  Icon={MessageCircleMore}
                />
              </div>
              <div className="flex gap-2">
                <div>
                  <Heart />
                </div>
                <div>789</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 text-sm">
                <p>203</p>
                <p>People commented</p>
            </div>
            <Comments />
          </div>
        </div>
      </div>
  )
}

export default PoetryComponent