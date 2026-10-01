import { Button, Icon } from '../../ui/index.jsx';

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
      <span className="well lg round" style={{ margin: '0 auto' }}><Icon name="paw" size={22} /></span>
      <h1 className="display-2" style={{ marginTop: 18 }}>This page wandered off.</h1>
      <p className="muted" style={{ marginTop: 10 }}>The link may be old, or the page has moved.</p>
      <div className="row gap-10" style={{ justifyContent: 'center', marginTop: 24 }}>
        <Button variant="dark" to="/">Go home</Button>
        <Button variant="outline" to="/shop">Visit the shop</Button>
      </div>
    </div>
  );
}
