import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react"; 
import "./Navbar.css"

const navigation = [
  { name: "HOME", href: "#", current: true },
  { name: "ABOUT", href: "#", current: false },
  { name: "GALLERY", href: "#", current: false },
  { name: "EVENTS", href: "#", current: false },
  { name: "TEAM", href: "#", current: false },
  { name: "CONTACT", href: "#", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const [currentItem, setCurrentItem] = useState(navigation[0]); 

  const handleClick = (item) => {
    setCurrentItem(item);
  };

  return (
    <Disclosure as="nav" className="fixed w-screen z-50 bg-[#101011]">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl sm:px-6 relative">
            <div className="relative flex h-24 w-screen items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-[#080AA4] hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 w-screen items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-6 w-auto"
                    src={"./Group 69.png"}
                    alt="FOCES Logo"
                  />            
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    <div className="Items flex space-x-7 absolute right-20 top-7">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.name === "CONTACT"
                            ? "bg-[#FFF] text-[#101011] rounded-full w-28 text-center"
                            : " hover:text-[#080AA4]",
                            item === currentItem
                              ? "bg-[#101011] text-[#080AA4]"
                              : "text-[#FFF] hover:text-[#080AA4]",
                            "rounded-md px-3 py-2 text-sm font-bold"
                          )}
                          onClick={() => handleClick(item)}
                          aria-current={item === currentItem ? "page" : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`sm:hidden ${open ? 'block' : 'hidden'}`}>
            <div className="space-y-1 bg-[#101011] w-screen text-center absolute px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item === currentItem
                      ? "text-[#080AA4]"
                      : "text-[#FFF] hover-bg-gray-700 hover-text-white",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                  onClick={() => handleClick(item)}
                  aria-current={item === currentItem ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
}
