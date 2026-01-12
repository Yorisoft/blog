import { useState, useEffect } from 'react'
import profilePic from './assets/img/profile-picture_1.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
    faSquareGithub, 
    faSquareLinkedin, 
    faSquareYoutube, 
    faTwitch, 
    faSquareXTwitter, 
    faSquareGitlab 
} from '@fortawesome/free-brands-svg-icons'
import { faUser, faBlog, faCircleHalfStroke, faMugHot } from '@fortawesome/free-solid-svg-icons'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// function applyTheme(theme: "light" | "dark") {
//   document.documentElement.classList.toggle("dark", theme === "dark")
//   localStorage.setItem("theme", theme)
// }

// function getInitialTheme(): "light" | "dark" {
//   const saved = localStorage.getItem("theme")
//   if (saved === "light" || saved === "dark") {
//     return saved
//   }

//   return window.matchMedia("(prefers-color-scheme: dark)").matches
//     ? "dark"
//     : "light"
// }
// var props = {theme: "light"}
// props: {
//     title:"",
//     date:"",
//     content:"",
//     imgSrc:""

// }
function App() {
// const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme())

  useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  return (
    <div className="h-screen flex bg-sidebar" >

    {/* Side Panel */}
      <div id="side-panel" className="flex flex-col items-center w-full max-w-65 bg-sidebar overflow-auto">

        <div className="flex flex-col py-2 items-center bg-muted-foreground">
            <h1 className="text-2xl font-bold">Yelsin Sepulveda</h1>
            <h1 className="text-l font-bold">Yorisoft</h1>
        </div>
        
        <img src={profilePic} alt="Yorisoft Logo" className="w-40 h-40 bg-sidebar-accent"/>
        
        <p className="my-2 text-center px-3 text-sm bg-muted-foreground">
            Hey, I'm Yorisoft! I love working on free open source software and content that delivers value to people. Welcome!
        </p>
        
        <div className="text-3xl mb-10 bg-sidebar-accent">
            <a href="https://github.com/yorisoft" target="_blank"><FontAwesomeIcon className="text-[#34d399]" icon={faSquareGithub} /></a>
            <a href="https://invent.kde.org/yorisoft" target="_blank"><FontAwesomeIcon className="text-[#34d399]" icon={faSquareGitlab} /></a>
            <a href="https://youtube.com/@Yoriisoft" target="_blank"><FontAwesomeIcon className="text-[#34d399]" icon={faSquareYoutube} /></a>
            <a href="https://twitch.tv/yorisoft" target="_blank"><FontAwesomeIcon className="text-[#34d399]" icon={faTwitch} /></a>
            <a href="https://www.linkedin.com/in/yelsin-sepulveda-lara" target="_blank"><FontAwesomeIcon className="text-[#34d399]" icon={faSquareLinkedin} /></a>
            <a href="https://x.com/yoriisoft" target="_blank"><FontAwesomeIcon className="text-[#34d399]" icon={faSquareXTwitter} /></a>
        </div>
        
        <div className="navbar-nav text-md bg-muted-foreground w-4/5">
            <ul className="">
                <li><FontAwesomeIcon icon={faUser} /> About Me</li>
                <li><FontAwesomeIcon icon={faBlog} /> Blog</li>
                <li><FontAwesomeIcon icon={faUser} /> About Me</li>
                <li><FontAwesomeIcon icon={faBlog} /> Blog</li>
                <li><FontAwesomeIcon icon={faUser} /> About Me</li>
                <li><FontAwesomeIcon icon={faBlog} /> Blog</li>
        
        
            </ul>
        </div>
        
        <div className="flex flex-col my-10 bg-sidebar-accent">
        <Label htmlFor="contact-form" className="text-lg font-bold mb-5 bg-muted-foreground">
            Support Me
        </Label>

        <div className="flex gap-4 text-xl mb-20 bg-muted-foreground">
            <a href="https://github.com/sponsors/Yorisoft" target="_blank">
              <img height="26" width="26" src="https://cdn.simpleicons.org/githubsponsors/34d399" />
            </a>
            <a href="https://ko-fi.com/yorisoft" target="_blank">
              <img height="26" width="26" src="https://cdn.simpleicons.org/kofi/34d399" />
            </a>
            <a href="https://www.patreon.com/cw/YORiSOFT" target="_blank">
              <img height="26" width="26" src="https://cdn.simpleicons.org/patreon/34d399" />
            </a>
        </div>

        </div>

        <div className="flex flex-row items-center space-x-2">
          <Label htmlFor="theme">Theme</Label>
          <Switch id="theme" className="" 
          onClick={toggleTheme}/>
        </div>
    
    </div>

    {/* Main Panel */}
    <div id="main-panel" className="flex flex-col items-center h-full w-full overflow-auto bg-background">

        <div className="flex w-full justify-center bg-destructive-foreground">
            <div className="flex w-2/5 py-23 gap-2 px-4 text-lg font-semibold">
              <Input type="email" placeholder="Email" />
              <Button type="submit" variant="outline">
                Subscribe
              </Button>

            </div>
        </div>

      <div className="flex flex-col w-4/5 gap-8 bg-sidebar-accent">
      {/*fetch blog
         for ( blogType blog in blogs) {}
        props.map((blogs) => (
          <Card className="flex h-40 bg-sky-50">
            <CardHeader>
              <CardTitle>{blogs.title}</CardTitle>
               <CardDescription> 
                    {blogs.content}
                </CardDescription>
            </CardHeader>
          </Card>
        ))
          */}
         <div className="flex flex-row gap-4">
             <img className="flex aspect-square object-cover bg-muted-foreground" src="" alt="Blog Image" />

            <Card className="flex h-55  bg-card border-border">
              <CardHeader>
                <CardTitle>"Blog Title"</CardTitle>
                <CardDescription>
                   "Published on 2024-06-10"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription> 
                      "This is a sample blog content. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                </CardDescription>
              </CardContent>
              <CardFooter>
                <CardAction>
                  <Button variant="link">Read More</Button>
                </CardAction>
              </CardFooter>
            </Card>
        </div>
         <div className="flex flex-row gap-4">
             <img className="flex aspect-square object-cover bg-muted-foreground" src="" alt="Blog Image" />

            <Card className="flex h-55  bg-card border-border">
              <CardHeader>
                <CardTitle>"Blog Title"</CardTitle>
                <CardDescription>
                   "Published on 2024-06-10"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription> 
                      "This is a sample blog content. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                </CardDescription>
              </CardContent>
              <CardFooter>
                <CardAction>
                  <Button variant="link">Read More</Button>
                </CardAction>
              </CardFooter>
            </Card>
        </div>

         <div className="flex flex-row gap-4">
             <img className="flex aspect-square object-cover bg-muted-foreground" src="" alt="Blog Image" />

            <Card className="flex h-55  bg-card border-border">
              <CardHeader>
                <CardTitle>"Blog Title"</CardTitle>
                <CardDescription>
                   "Published on 2024-06-10"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription> 
                      "This is a sample blog content. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                </CardDescription>
              </CardContent>
              <CardFooter>
                <CardAction>
                  <Button variant="link">Read More</Button>
                </CardAction>
              </CardFooter>
            </Card>
        </div>

                 <div className="flex flex-row gap-4">
             <img className="flex aspect-square object-cover bg-muted-foreground" src="" alt="Blog Image" />

            <Card className="flex h-55 bg-card border-border">
              <CardHeader>
                <CardTitle>"Blog Title"</CardTitle>
                <CardDescription>
                   "Published on 2024-06-10"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription>
                      "This is a sample blog content. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                </CardDescription>
              </CardContent>
              <CardFooter>
                <CardAction>
                  <Button variant="link">Read More</Button>
                </CardAction>
              </CardFooter>
            </Card>
        </div>

      </div>
    </div>
</div>
  )
}

export default App
