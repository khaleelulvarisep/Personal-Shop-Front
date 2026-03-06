import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Parallax } from "swiper/modules";
import { useNavigate} from "react-router-dom";

import "swiper/css";
import "swiper/css/pagination";
import "./home-ui.css";

const slides = [
  {
    eyebrow: "Efficiency Redefined",
    title: "Grocery Shopping, Simplified.",
    description: "Experience the future of local logistics. We connect you with your favorite stores for instant fulfillment.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000",
    accent: "#10b981"
  },
  {
    eyebrow: "Personal Assistant",
    title: "Your Errands, Our Priority.",
    description: "From custom shopping lists to specific brand requests, our partners handle every detail with care.",
    image: "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=1000",
    accent: "#f59e0b"
  },
  {
    eyebrow: "Community First",
    title: "Support Local Businesses.",
    description: "Every delivery strengthens your local economy. Fast, reliable, and community-driven.",
    image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=1000",
    accent: "#3b82f6"
  }
];

const HomeCarousel = () => {
    const navigate = useNavigate();

  return (
    <div className="premium-carousel-container">
      <Swiper
        speed={1200}
        parallax={true} // Enables the parallax effect
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        pagination={{ clickable: true }}
        modules={[Autoplay, Pagination, Parallax]}
        className="premium-swiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="premium-grid">
              
              {/* Left Side: Text Content with parallax attributes */}
              <div className="premium-text-area">
                <div className="text-content-wrapper">
                  <span 
                    className="premium-eyebrow" 
                    data-swiper-parallax="-200" // Moves slower
                    style={{ color: slide.accent }}
                  >
                    {slide.eyebrow}
                  </span>
                  <h1 
                    className="premium-title" 
                    data-swiper-parallax="-400" // Moves faster
                  >
                    {slide.title}
                  </h1>
                  <p 
                    className="premium-description" 
                    data-swiper-parallax="-600" // Moves fastest
                  >
                    {slide.description}
                  </p>
                  <div className="premium-actions" data-swiper-parallax="-800">
                    <button
                      className="btn-primary"
                      style={{ backgroundColor: slide.accent }}
                      onClick={() => navigate("/order")}
                    >
                      Get Started
                    </button>
                    <button className="btn-secondary">Learn More</button>
                  </div>
                </div>
              </div>

              {/* Right Side: Image with separate parallax speed */}
              <div className="premium-image-area" data-swiper-parallax="-100">
                <div 
                  className="premium-image-inner" 
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HomeCarousel;
