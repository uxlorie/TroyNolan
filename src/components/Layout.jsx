import Background from './Background';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Background />
      <main className="layout__content">{children}</main>
    </div>
  );
}
