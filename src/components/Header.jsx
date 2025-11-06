import starLogo from '../assets/star128.png'

function Header() {
  return (
    <header className="p-6">
      <div className="flex items-center gap-2">
        <img
          src={starLogo}
          alt="SlidePolish logo"
          className="h-8 w-8 object-contain"
        />
        <span className="text-white text-lg font-semibold tracking-wide">SlidePolish</span>
      </div>
    </header>
  )
}

export default Header

