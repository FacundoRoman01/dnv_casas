import { useState } from "react"
import { DndContext, closestCenter } from "@dnd-kit/core"
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import api from "../../lib/api"

// Mismo límite que el backend (CloudinaryImageService / LocalImageService).
// Repetido acá a propósito: el backend es la garantía real (nadie se lo
// salta pegándole directo a la API), esto es solo para avisar antes de
// intentar subir y ahorrarle al usuario un viaje al servidor que va a fallar.
const MAX_IMAGENES_POR_PROPIEDAD = 30

// Resuelve la URL final de una imagen. Con Cloudinary, image.url ya viene
// absoluta (https://res.cloudinary.com/...) y hay que usarla tal cual. Con el
// almacenamiento local viejo, image.url venía relativa (/uploads/xxx.jpg) y
// había que prefijarla con el host del back. Soportamos los dos casos para
// no romper imágenes que ya estén guardadas de antes del cambio a Cloudinary.
function resolveImageUrl(url) {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${(import.meta.env.VITE_API_URL || "http://localhost:5254/api").replace("/api", "")}${url}`
}

/**
 * SortableImage: una tarjeta de imagen arrastrable dentro de la grilla.
 * Recibe `image` ({ id, url, isCover, displayOrder }) y `onDelete`.
 * useSortable le da los handlers de drag & drop de @dnd-kit; el botón ⠿
 * es el "handle" (los listeners van ahí, no en toda la tarjeta).
 */
function SortableImage({ image, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
      <img src={resolveImageUrl(image.url)} alt="" className="w-full h-full object-cover" />
      {image.isCover && (
        <span className="absolute top-1 left-1 bg-accent text-white text-xs px-2 py-0.5 rounded-full font-semibold">Portada</span>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* type="button" en ambos: sin esto, si ImageManager vive dentro de un
            <form>, el navegador los trata como submit por defecto y dispara
            el guardado/redirect del formulario al clickear o soltar el drag. */}
        <button
          type="button"
          {...attributes} {...listeners}
          className="bg-white/90 text-gray-700 p-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing"
          title="Arrastrar"
        >⠿</button>
        <button
          type="button"
          onClick={() => onDelete(image.id)}
          className="bg-red-500 text-white p-1.5 rounded-lg text-xs"
          title="Eliminar"
        >✕</button>
      </div>
    </div>
  )
}

/**
 * ImageManager: manager de imágenes de la propiedad.
 * Recibe `propertyId`, el array `images` y `onChange` (que acepta también
 * un updater tipo setState). Permite subir fotos (multipart), borrarlas y
 * reordenarlas por drag & drop. A diferencia de otros forms, acá SÍ pega al
 * back en cada acción (upload/delete/reorder) porque son operaciones directas.
 */
export default function ImageManager({ propertyId, images, onChange }) {
  const [uploading, setUploading] = useState(false)

  const espaciosDisponibles = MAX_IMAGENES_POR_PROPIEDAD - images.length
  const limiteAlcanzado = espaciosDisponibles <= 0

  // Sube cada archivo elegido, de a uno, como multipart/form-data.
  // Corta si alguno pesa más de 10 MB (límite del back), si ya se llegó al
  // máximo de fotos, o si la selección actual haría superarlo. Por cada
  // respuesta OK agrega la imagen devuelta al array vía onChange(prev => ...).
  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (limiteAlcanzado) {
      alert(`Esta propiedad ya alcanzó el máximo de ${MAX_IMAGENES_POR_PROPIEDAD} fotos.`)
      e.target.value = ""
      return
    }

    if (files.length > espaciosDisponibles) {
      alert(`Solo podés subir ${espaciosDisponibles} foto(s) más (máximo ${MAX_IMAGENES_POR_PROPIEDAD} por propiedad). Elegiste ${files.length}.`)
      e.target.value = ""
      return
    }

    const oversized = files.find(f => f.size > 10 * 1024 * 1024)
    if (oversized) {
      alert(`"${oversized.name}" supera los 10 MB. Comprimí la imagen antes de subirla.`)
      e.target.value = ""
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const form = new FormData()
        form.append("file", file)
        const { data } = await api.post(`/admin/properties/${propertyId}/images`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        onChange(prev => [...prev, data])
      }
    } catch {
      alert("Error al subir una foto. Revisá el formato e intentá de nuevo.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  // Borra una foto en el back y la saca del array local si salió bien.
  async function handleDelete(imageId) {
    if (!confirm("¿Eliminás esta foto?")) return
    try {
      await api.delete(`/admin/images/${imageId}`)
      onChange(prev => prev.filter(i => i.id !== imageId))
    } catch {
      alert("Error al eliminar la foto. Intentá de nuevo.")
    }
  }

  // Fin del drag: reordena el array y recalcula displayOrder. Por convención
  // del contrato, la imagen en la posición 0 es la portada (isCover). Manda al
  // back solo la lista de IDs en el nuevo orden y, si OK, actualiza local.
  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex(i => i.id === active.id)
    const newIndex = images.findIndex(i => i.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
      ...img, displayOrder: idx, isCover: idx === 0
    }))
    try {
      await api.put(`/admin/properties/${propertyId}/images/reorder`, reordered.map(i => i.id))
      onChange(reordered)
    } catch {
      alert("No se pudo reordenar las fotos. Intentá de nuevo.")
    }
  }

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {images.map(img => (
              <SortableImage key={img.id} image={img} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 cursor-pointer hover:border-accent transition-colors ${(uploading || limiteAlcanzado) ? "opacity-50 pointer-events-none" : ""}`}>
        <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading || limiteAlcanzado} />
        <span className="text-gray-400 text-sm">
          {uploading
            ? "Subiendo..."
            : limiteAlcanzado
              ? `Límite de ${MAX_IMAGENES_POR_PROPIEDAD} fotos alcanzado`
              : "📷 Subir fotos"}
        </span>
      </label>
      {images.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Arrastrá para reordenar · La primera imagen es la portada · {images.length}/{MAX_IMAGENES_POR_PROPIEDAD} fotos
        </p>
      )}
    </div>
  )
}