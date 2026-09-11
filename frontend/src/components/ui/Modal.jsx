// src/components/ui/Modal.jsx

export default function Modal({ children, onClose }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(20, 23, 27, .7)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Contenido del Modal */}
      <div 
        className="no-scrollbar"
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "24px",
          padding: "24px 28px", // Reducimos un poco el padding general
          width: "100%",
          maxWidth: "580px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 10px 40px rgba(0,0,0,.2)",
          scrollbarWidth: "none", /* Oculta scroll en Firefox */
          msOverflowStyle: "none", /* Oculta scroll en IE/Edge viejo */
        }}
      >
        {/* Estilo incrustado para ocultar la barra de scroll en Chrome/Safari */}
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Botón de cierre */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#F5F7F9",
            border: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          <svg width={16} height={16} fill="none" stroke="#67717F" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {children}
      </div>
    </div>
  );
}