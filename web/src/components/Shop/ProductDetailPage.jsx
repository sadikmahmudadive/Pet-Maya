import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Star, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus, 
  Check, 
  Heart, 
  ArrowLeft, 
  Share2, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export default function ProductDetailPage({ productId, onBack, onNavigate }) {
  const { products, addToCart, openModal, showToast } = useApp();

  // Find product or fallback to first product
  const product = (products && products.find(p => p.id === productId)) || (products && products[0]) || {
    id: 'p1',
    name: 'Royal Canin Golden Retriever Adult',
    category: 'food',
    price: 64.99,
    originalPrice: 79.99,
    discountPct: 19,
    rating: 4.9,
    ratingCount: 128,
    stock: 24,
    brand: 'Royal Canin',
    badge: 'BEST SELLER',
    sku: 'RC-GR-3KG',
    isRx: false,
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
    description: 'Tailored kibble designed specifically for the cardiac health, joint mobility, and skin barrier of adult Golden Retrievers over 15 months.',
    specifications: {
      weight: '3.0 kg',
      lifestage: 'Adult (Over 15 months)',
      breedSuitability: 'Golden Retriever & large retriever breeds',
      origin: 'France (Veterinary Import)'
    },
    usageGuide: 'Feed 330g - 380g daily divided into 2 meals based on activity level. Fresh water must always be available.'
  };

  // Image gallery state
  const galleryImages = [
    product.image,
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80'
  ];
  const [activeImage, setActiveImage] = useState(0);

  // Purchase state
  const [selectedSize, setSelectedSize] = useState('3.0 kg');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Accordion state (indices: 0 = Description, 1 = Ingredients, 2 = Reviews, 3 = Shipping)
  const [openAccordions, setOpenAccordions] = useState({ 0: true, 1: false, 2: false, 3: false });

  const toggleAccordion = (idx) => {
    setOpenAccordions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddToCart = () => {
    addToCart({ ...product, selectedSize }, quantity);
    openModal('cart');
    showToast(`Added ${quantity} × ${product.name} to your bag!`, 'success');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('shop');
    } else {
      window.location.hash = 'shop';
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--foreground)', minHeight: '100vh', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
        
        {/* Top Breadcrumb & Back Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Care Shop</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={handleBack}>Shop</span>
            <ChevronRight size={13} />
            <span style={{ textTransform: 'capitalize' }}>{product.category || 'Nutrition'}</span>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{product.name}</span>
          </div>
        </div>

        {/* Main PDP Grid: Gallery Left, Sticky Info Right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'clamp(36px, 5vw, 64px)',
          alignItems: 'flex-start'
        }}>
          
          {/* ═══════════════════════════════════════════════════════════
              GALLERY LEFT
              ═══════════════════════════════════════════════════════════ */}
          <div>
            {/* Primary Main Image Container */}
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              aspectRatio: '1',
              position: 'relative',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.04)',
              marginBottom: '16px'
            }}>
              <img
                src={galleryImages[activeImage]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {product.badge && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(217, 168, 115, 0.94)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '4px 12px',
                  borderRadius: '9999px'
                }}>
                  {product.badge}
                </div>
              )}

              <button
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  showToast(isWishlisted ? 'Removed from saved items' : 'Saved to wishlist', 'info');
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  color: isWishlisted ? '#EF4444' : 'var(--foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} />
              </button>
            </div>

            {/* Thumbnail Selector Row */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: activeImage === idx ? '2px solid #2ECC9B' : '1px solid var(--border)',
                    padding: 0,
                    backgroundColor: 'var(--surface)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    opacity: activeImage === idx ? 1 : 0.65,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>

            {/* Cold Chain & Clinical Guarantee Banner */}
            <div style={{
              marginTop: '24px',
              padding: '16px 20px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 204, 155, 0.12)',
                color: '#158763',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Truck size={20} />
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                <strong style={{ display: 'block', color: 'var(--foreground)' }}>Cold-Chain Express Delivery</strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Ships within 24 hours in insulated, temperature-monitored packaging.
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              STICKY INFO RIGHT
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ position: 'sticky', top: '24px' }}>
            
            {/* Brand & Title */}
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#D9A873', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              {product.brand || 'Veterinary Clinical Nutrition'}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 600,
              lineHeight: 1.25,
              color: 'var(--foreground)',
              margin: '0 0 12px 0',
              letterSpacing: '-0.02em'
            }}>
              {product.name}
            </h1>

            {/* Rating Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#F59E0B" />
                ))}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                {product.rating || 4.9}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                ({product.ratingCount || 128} verified reviews)
              </span>
            </div>

            {/* Price Box with Sand Accent */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
              padding: '16px 20px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              marginBottom: '24px'
            }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--foreground)'
              }}>
                ৳{product.price}
              </div>
              {product.originalPrice && (
                <div style={{ fontSize: '16px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                  ৳{product.originalPrice}
                </div>
              )}
              {product.discountPct && (
                <div className="sand-badge" style={{ marginLeft: 'auto' }}>
                  Save {product.discountPct}%
                </div>
              )}
            </div>

            {/* Stock Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '24px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2ECC9B' }} />
              <span style={{ fontWeight: 600, color: '#158763' }}>In Stock</span>
              <span style={{ color: 'var(--text-secondary)' }}>• Dispatches today with live tracking</span>
            </div>

            {/* Size / Variant Selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px' }}>
                Select Bag Size / Variant
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['1.5 kg', '3.0 kg', '12.0 kg'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      border: selectedSize === size ? '2px solid #2ECC9B' : '1px solid var(--border)',
                      backgroundColor: selectedSize === size ? 'rgba(46, 204, 155, 0.10)' : 'var(--surface)',
                      color: selectedSize === size ? '#158763' : 'var(--foreground)',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & Add to Bag CTA */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '6px'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Mint Primary CTA */}
              <button
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--primary)',
                  color: '#1F2421',
                  fontSize: '15px',
                  fontWeight: 600,
                  padding: '14px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(46, 204, 155, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={18} />
                <span>Add to Bag — ৳{(product.price * quantity).toFixed(2)}</span>
              </button>
            </div>

            {/* Reassurance Bullet Strip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#2ECC9B" />
                <span>100% Genuine batch certification with expiration guarantee</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#2ECC9B" />
                <span>Free temperature-monitored delivery on orders over ৳1,000</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#2ECC9B" />
                <span>Hassle-free 7-day veterinary return & replacement policy</span>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                ACCORDION SECTIONS
                (Description, Ingredients, Reviews, Shipping)
                ═══════════════════════════════════════════════════════════ */}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              
              {/* Accordion 1: Description */}
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleAccordion(0)}
                  style={{
                    width: '100%',
                    padding: '18px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--foreground)'
                  }}
                >
                  <span>Description & Clinical Benefits</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: openAccordions[0] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {openAccordions[0] && (
                  <div style={{ paddingBottom: '18px', fontSize: '14px', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                    <p style={{ margin: '0 0 12px 0' }}>{product.description}</p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Feeding & Usage Guide:</strong> {product.usageGuide || 'Divide recommended daily intake into two equal meals. Adjust according to weight, activity, and climate.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Ingredients & Guaranteed Analysis */}
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleAccordion(1)}
                  style={{
                    width: '100%',
                    padding: '18px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--foreground)'
                  }}
                >
                  <span>Ingredients & Guaranteed Analysis</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: openAccordions[1] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {openAccordions[1] && (
                  <div style={{ paddingBottom: '18px', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      backgroundColor: 'var(--surface)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      marginBottom: '12px'
                    }}>
                      <div>Crude Protein (min): <strong style={{ color: 'var(--foreground)' }}>25.0%</strong></div>
                      <div>Crude Fat (min): <strong style={{ color: 'var(--foreground)' }}>13.0%</strong></div>
                      <div>Crude Fiber (max): <strong style={{ color: 'var(--foreground)' }}>3.8%</strong></div>
                      <div>Moisture (max): <strong style={{ color: 'var(--foreground)' }}>10.0%</strong></div>
                      <div>EPA + DHA (min): <strong style={{ color: 'var(--foreground)' }}>0.41%</strong></div>
                      <div>Taurine (min): <strong style={{ color: 'var(--foreground)' }}>0.29%</strong></div>
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px' }}>
                      <em>Selected Ingredients:</em> Dehydrated poultry protein, maize, rice, wheat, animal fats, vegetable protein isolate, hydrolysed animal proteins, beet pulp, fish oil, borage oil, marigold extract (source of lutein).
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Verified Customer Reviews */}
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleAccordion(2)}
                  style={{
                    width: '100%',
                    padding: '18px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--foreground)'
                  }}
                >
                  <span>Verified Customer Reviews (128)</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: openAccordions[2] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {openAccordions[2] && (
                  <div style={{ paddingBottom: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      {
                        name: 'Tanvir A.',
                        pet: '3-yr Golden Retriever',
                        rating: 5,
                        comment: 'Noticeable improvement in coat shine and zero digestive upset. Delivery was fast and temperature controlled.',
                        date: '2 days ago'
                      },
                      {
                        name: 'Nusrat J.',
                        pet: '5-yr Labrador',
                        rating: 5,
                        comment: 'Our vet recommended this tailored formula for joint and cardiac care. Very happy with Pet Maya service.',
                        date: '1 week ago'
                      }
                    ].map((rev, i) => (
                      <div key={i} style={{ backgroundColor: 'var(--surface)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: 'var(--foreground)' }}>{rev.name}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>{rev.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', color: '#F59E0B', marginBottom: '6px' }}>
                          {[...Array(rev.rating)].map((_, idx) => (
                            <Star key={idx} size={11} fill="#F59E0B" />
                          ))}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{rev.comment}</div>
                        <div style={{ fontSize: '11px', color: '#D9A873', fontWeight: 600 }}>Verified Parent • {rev.pet}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 4: Shipping & Cold-Chain Guarantee */}
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleAccordion(3)}
                  style={{
                    width: '100%',
                    padding: '18px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--foreground)'
                  }}
                >
                  <span>Shipping & Cold-Chain Guarantee</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: openAccordions[3] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {openAccordions[3] && (
                  <div style={{ paddingBottom: '18px', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      All prescription diets and medications are picked from licensed, climate-controlled veterinary pharmacies.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      <li>Standard delivery: 2-3 business days across Bangladesh.</li>
                      <li>Express 24h Cold-Chain: available for Dhaka metropolitan areas.</li>
                      <li>Free shipping on orders exceeding ৳1,000.</li>
                    </ul>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

