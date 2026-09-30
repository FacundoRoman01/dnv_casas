import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import ImageManager from "../../components/admin/ImageManager"
import AvailabilityCalendar from "../../components/admin/AvailabilityCalendar"
import SeasonPrices from "../../components/admin/SeasonPrices"
import { useAdminProperty, useAdminDestinations } from "../../hooks/useAdmin"
import api from "../../lib/api"

// Amenidades disponibles: se guardan como array de keys (strings) en la propiedad.
const AMENITY_OPTIONS = [
  { key: "wifi", label: "Wi-Fi" }, { key: "parking", label: "Cochera" },
  { key: "bbq", label: "Parrilla" }, { key: "linen", label: "Ropa blanca" },
  { key: "pets", label: "Pet-friendly" }, { key: "fireplace", label: "Estufa a leña" },
  { key: "pool", label: "Pileta" }, { key: "ac", label: "Aire acondicionado" },
  { key: "heating", label: "Calefacción" }, { key: "tv", label: "TV / Cable" },
  { key: "washer", label: "Lavarropas" }, { key: "dishwasher", label: "Lavavajillas" },
  { key: "garden", label: "Jardín" }, { key: "terrace", label: "Terraza / Balcón" },
  { key: "quincho", label: "Quincho" }, { key: "jacuzzi", label: "Jacuzzi" },
  { key: "gym", label: "Gimnasio" }, { key: "security", label: "Seguridad / Alarma" },
  { key: "elevator", label: "Ascensor" }, { key: "workspace", label: "Espacio de trabajo" },
]

// Categorías: el value es el int exacto del enum del back (0=Alquiler, 1=Intercambio, 2=Compra).
const CATEGORY_OPTIONS = [
  { value: 0, label: "Alquiler" }, { value: 1, label: "Intercambio" }, { value: 2, label: "Compra" }
]

// Tipos de propiedad: idem, el value es el int del enum del back (0=Casa ... 4=Otro).
const PROPERTY_TYPE_OPTIONS = [
  { value: 0, label: "Casa" }, { value: 1, label: "Departamento" },
  { value: 2, label: "Cabaña" }, { value: 3, label: "Loft" }, { value: 4, label: "Otro" }
]

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "$ ARS" }, { value: "USD", label: "US$ USD" }
]

// Estado inicial del formulario para una propiedad nueva. Los nombres de campo son
// exactamente los que espera el back (camelCase, ej whatsAppMessage): no tocar sin coordinar API.
const EMPTY_FORM = {
  title: "", description: "", category: 0, propertyType: 0, destinationId: "",
  neighborhood: "", price: "", priceLabel: "por noche", currency: "ARS",
  bedrooms: 1, bathrooms: 1, squareMeters: "", landSize: "",
  capacity: 2, whatsAppMessage: "", youtubeUrl: "",
  amenities: [], seasonPrices: [], availability: [],
}

/**
 * Formulario de alta/edición de propiedad del backoffice, organizado en tabs
 * (Información, Amenidades, Tarifas, Fotos, Disponibilidad). Sirve para las dos cosas:
 * si la URL trae :id estamos editando (isEdit), si no estamos creando una nueva.
 * Al guardar arma el payload que espera el back y hace POST (crear) o PUT (editar).
 */
export default function PropertyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Si hay id en la URL es edición; si no, alta. Muchas cosas (tabs, requests) dependen de esto.
  const isEdit = Boolean(id)

  const { property, loading: loadingProp } = useAdminProperty(id)
  const { destinations } = useAdminDestinations()

  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("info")

  // Cuando el hook trae la propiedad a editar, volcamos sus campos al form.
  // Los ?? "" / ?? 0 son para no romper inputs controlados si el back manda null.
  useEffect(() => {
    if (property) {
      setForm({
        title: property.title,
        description: property.description,
        category: property.category,
        propertyType: property.propertyType ?? 0,
        destinationId: property.destinationId,
        neighborhood: property.neighborhood,
        price: property.price ?? "",
        priceLabel: property.priceLabel,
        currency: property.currency ?? "ARS",
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms ?? 0,
        squareMeters: property.squareMeters ?? "",
        landSize: property.landSize ?? "",
        capacity: property.capacity,
        whatsAppMessage: property.whatsAppMessage,
        youtubeUrl: property.youtubeUrl ?? "",
        amenities: property.amenities || [],
        seasonPrices: property.seasonPrices?.map(s => ({
          label: s.label,
          pricePerNight: s.pricePerNight,
          dateFrom: s.dateFrom,
          dateTo: s.dateTo,
        })) || [],
        availability: property.availability?.map(a => ({ date: a.date, status: a.status })) || [],
      })
      setImages(property.images || [])
    }
  }, [property])

  // Helper genérico para actualizar un campo del form por nombre.
  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Agrega o saca una amenidad del array según si ya estaba seleccionada.
  function toggleAmenity(key) {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter(a => a !== key)
        : [...prev.amenities, key]
    }))
  }

  // Submit del formulario: valida, arma el payload con los tipos que espera el back y guarda.
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      // Destino es obligatorio a nivel dominio, lo cortamos acá antes de pegarle al back.
      if (!form.destinationId) {
        setError("Destino es obligatorio.")
        setSaving(false)
        return
      }
      // Validación de temporadas: la fecha desde tiene que ser anterior a la hasta.
      for (const s of form.seasonPrices) {
        if (!s.dateFrom || !s.dateTo) {
          setError(`Temporada "${s.label || "sin nombre"}": completá las fechas con el formato DD/MM/AAAA.`)
          setSaving(false)
          return
        }
        if (s.dateFrom >= s.dateTo) {
          setError(`Temporada "${s.label || "sin nombre"}": la fecha inicio debe ser anterior a la fecha fin.`)
          setSaving(false)
          return
        }
      }
      // Armado del payload contra el contrato del back: los inputs guardan strings,
      // pero el back espera números para precios/metrajes/capacidad y para los enums
      // (destinationId, propertyType). Precio vacío => null ("a consultar"), no 0.
      const payload = {
        ...form,
        price: form.price === "" ? null : Number(form.price),
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        squareMeters: form.squareMeters === "" ? null : Number(form.squareMeters) || null,
        landSize: form.landSize,
        capacity: Number(form.capacity) || 0,
        destinationId: Number(form.destinationId),
        propertyType: Number(form.propertyType),
        currency: form.currency,
        // Vacío => null: mismo criterio que el resto de los campos opcionales, para
        // no mandar "" al back cuando en realidad significa "sin video cargado".
        youtubeUrl: form.youtubeUrl === "" ? null : form.youtubeUrl,
        seasonPrices: form.seasonPrices.map(s => ({
          ...s, pricePerNight: Number(s.pricePerNight)
        })),
      }

      if (isEdit) {
        // Editar: guardamos la propiedad y, en un request aparte, la disponibilidad (el back la
        // expone en otro endpoint y espera { days: [...] }).
        await api.put(`/admin/properties/${id}`, payload)
        await api.put(`/admin/properties/${id}/availability`, { days: form.availability })
      } else {
        // Crear: el back devuelve la propiedad nueva; saltamos a su edición para poder
        // cargar fotos y disponibilidad (tabs que solo existen en modo edición).
        const { data } = await api.post("/admin/properties", payload)
        navigate(`/admin/editar/${data.id}`)
        return
      }
      navigate("/admin")
    } catch (err) {
      setError("Ocurrió un error al guardar. Revisá los campos.")
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && !loadingProp && !property) return (
    <AdminLayout>
      <p className="p-8 text-red-500">Error al cargar la propiedad. Recargá la página.</p>
    </AdminLayout>
  )

  if (isEdit && loadingProp) return (
    <AdminLayout>
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </AdminLayout>
  )

  // Tabs visibles según el caso: "Tarifas" solo aplica a alquileres (category === 0), y
  // "Fotos"/"Disponibilidad" solo en edición (necesitan un id ya creado).
  const TABS = [
    { id: "info", label: "📝 Información" },
    { id: "amenities", label: "✨ Amenidades" },
    ...(form.category === 0 ? [{ id: "seasons", label: "💰 Tarifas" }] : []),
    ...(isEdit ? [
      { id: "photos", label: "📷 Fotos" },
      { id: "availability", label: "📅 Disponibilidad" },
    ] : []),
  ]

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/admin")} className="text-gray-400 hover:text-primary">←</button>
          <h1 className="text-2xl font-bold text-primary">
            {isEdit ? "Editar propiedad" : "Nueva propiedad"}
          </h1>
        </div>

        {/* Tabs */}
        {/* <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? "bg-white shadow text-primary" : "text-gray-500 hover:text-primary"}`}>
              {t.label}
            </button>
          ))}
        </div> */}

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(t => (
            <button type="button" key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? "bg-white shadow text-primary" : "text-gray-500 hover:text-primary"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* INFO */}
          {activeTab === "info" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Título *</label>
                  <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.title} onChange={e => set("title", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Categoría</label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.category} onChange={e => {
                      // Cambiar de categoría reajusta el form: los alquileres (0) usan "por noche"
                      // y tarifas por temporada; las compras (2) no llevan etiqueta de precio.
                      // Si dejás de ser alquiler, se limpian las tarifas y se sale del tab Tarifas.
                      const cat = Number(e.target.value)
                      setForm(prev => ({
                        ...prev,
                        category: cat,
                        priceLabel: cat === 0 ? "por noche" : cat === 2 ? "" : prev.priceLabel,
                        seasonPrices: cat !== 0 ? [] : prev.seasonPrices,
                      }))
                      if (cat !== 0 && activeTab === "seasons") setActiveTab("info")
                    }}>
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Tipo de propiedad</label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.propertyType} onChange={e => set("propertyType", Number(e.target.value))}>
                    {PROPERTY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Destino *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.destinationId} onChange={e => set("destinationId", e.target.value)}>
                    <option value="">Seleccioná un destino</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Barrio / Zona</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Dormitorios</label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Baños</label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Capacidad (personas)</label>
                  <input type="number" min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.capacity} onChange={e => set("capacity", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">M² cubiertos</label>
                  <input type="number" min="0" placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.squareMeters} onChange={e => set("squareMeters", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Terreno / lote</label>
                  <input type="text" placeholder="Ej: 500 m², 1 ha (opcional)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.landSize} onChange={e => set("landSize", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Moneda</label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.currency} onChange={e => set("currency", e.target.value)}>
                    {CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Precio base</label>
                  <input type="number" min="0" placeholder="Dejar vacío si es 'a consultar'"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.price} onChange={e => set("price", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Etiqueta de precio</label>
                  <input type="text" placeholder="por noche" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.priceLabel} onChange={e => set("priceLabel", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Descripción</label>
                  <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none"
                    value={form.description} onChange={e => set("description", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Mensaje de WhatsApp</label>
                  <input type="text" placeholder="Hola, me interesa esta propiedad..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.whatsAppMessage} onChange={e => set("whatsAppMessage", e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">Si lo dejás vacío, se genera automáticamente.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Link de YouTube (opcional)</label>
                  <input type="url" placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    value={form.youtubeUrl} onChange={e => set("youtubeUrl", e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">Se muestra como video embebido en la ficha pública de la propiedad.</p>
                </div>
              </div>
            </div>
          )}

           {/* AMENIDADES */}
          {activeTab === "amenities" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-4">Seleccioná las amenidades que incluye la propiedad.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITY_OPTIONS.map(a => (
                  <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${form.amenities.includes(a.key) ? "border-accent bg-accent/5 text-primary" : "border-gray-100 text-gray-500 hover:border-gray-300"}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TARIFAS */}
          {activeTab === "seasons" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-4">Configurá los precios por temporada.</p>
              <SeasonPrices seasons={form.seasonPrices} onChange={v => set("seasonPrices", v)} />
            </div>
          )}

          {/* FOTOS */}
          {activeTab === "photos" && isEdit && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-4">Subí y ordená las fotos de la propiedad.</p>
              <ImageManager propertyId={id} images={images} onChange={setImages} />
            </div>
          )}

          {/* DISPONIBILIDAD */}
          {activeTab === "availability" && isEdit && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-4">Marcá los días no disponibles o en gestión.</p>
              <AvailabilityCalendar
                availability={form.availability}
                onChange={v => set("availability", v)}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={saving}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear propiedad"}
            </button>
            <button type="button" onClick={() => navigate("/admin")}
              className="border border-gray-200 text-gray-500 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
