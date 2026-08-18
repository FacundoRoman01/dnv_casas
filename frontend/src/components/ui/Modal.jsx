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
      <div style={{
        position: "relative",
        background: "#fff",
        borderRadius: "24px",
        padding: "32px",
        width: "90%",
        maxWidth: "600px",
        boxShadow: "0 10px 40px rgba(0,0,0,.2)",
      }}>
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
