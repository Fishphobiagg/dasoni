import React, { useState } from 'react';
import logo from '../../assets/image/logo.png';
import './Header.css';
import BasicAvartar from '../Avarta/BasicAvatar/BasicAvartar';
import { logout } from '../../app/slices/user';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onModalToggle?: () => void;
}

function Header({ onModalToggle }: HeaderProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout(); // 로그아웃 함수를 호출하여 토큰을 삭제하고 Redux 상태를 초기화합니다.
    navigate('/');
  };
  // 필터 버튼 토클
  const [isOpen, setIsOpen] = useState(false);
  const handleToggleFilter = () => {
    setIsOpen((prevState) => !prevState);
  };
  return (
    <header className="header">
      <Link className="logo" to="/main">
        <img src={logo} alt="다소니 로고 이미지"></img>
      </Link>
      <nav className="nav">
        <ul id="nav-bar">
          <li>
            <span className="material-symbols-outlined filled">favorite</span>
            <span className="material-symbols-outlined filled">favorite</span>
          </li>

          <li>
            <BasicAvartar src="default_profile.png" />
          </li>

          <div id="filter-menu">
            <button className="material-symbols-outlined" onClick={handleToggleFilter}>
              menu
            </button>
            <ul className={isOpen ? 'show' : ''}>
              <li>
                <button className="material-symbols-outlined" onClick={onModalToggle}>
                  help
                </button>
              </li>
              <li>
                <button onClick={handleLogout}>로그아웃</button>
              </li>
              <li>
                <Link to="/mypage">마이페이지</Link>
              </li>
            </ul>
          </div>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
