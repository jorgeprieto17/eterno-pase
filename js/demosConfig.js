/**
 * ============================================================================
 * ETERNO PASE — CONFIGURACIÓN CENTRALIZADA DE MARCA Y DEMOS
 * ============================================================================
 * PLANTILLA RÁPIDA (< 15 MIN) PARA DUPLICAR Y PERSONALIZAR UN NUEVO CLIENTE:
 * 1. Copia cualquiera de los bloques dentro de `DEMOS_CONFIG` (por ejemplo `boda`)
 *    y cámbiale la clave (ej. `boda_camila_diego`).
 * 2. Edita los textos principales: `title`, `subtitle`, `eventDate`, `quote`,
 *    `hosts`, `locations`, `itinerary`, `dressCode` y `gifts` (CLABE/banco).
 * 3. Opcional: cambia `music.customMp3Url` por la ruta a tu archivo `.mp3`
 *    (ej. "./assets/musica-cliente.mp3"). Si queda vacío, se usa el sintetizador
 *    polifónico HTML5 integrado (`audioSynth.js`) acorde al tema.
 * 4. Ajusta `colors` si el cliente desea otra paleta cromática.
 * 5. Para compartir por WhatsApp con vista previa propia, duplica `boda.html`,
 *    actualiza sus metatags `og:title`, `og:description`, `og:image` y cambia
 *    `data-initial-demo="tu_nueva_clave"` en el <body>.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const EternoPase = (global.EternoPase = global.EternoPase || {});

  /**
   * Configuración global de la marca Eterno Pase
   */
  EternoPase.BRAND_CONFIG = {
    name: 'Eterno Pase',
    slogan: 'Una invitación que no se desecha, dura para siempre',
    subheadline:
      'Invitaciones digitales interactivas diseñadas para brillar dentro de WhatsApp. Música, GPS directo, cuenta regresiva, mesa de regalos y confirmación en 1 clic.',
    whatsappNumber: '5215657978859',
    whatsappUrl: 'https://wa.me/5215657978859',
    whatsappQuoteText:
      '¡Hola Eterno Pase! Vi su plataforma de demostración y me gustaría cotizar una invitación digital personalizada.',
    benefits: [
      {
        id: 'whatsapp',
        icon: 'whatsapp',
        title: 'Envío por WhatsApp en 1 clic',
        description:
          'Vista previa profesional con tarjeta Open Graph optimizada para abrirse al instante en el navegador integrado de WhatsApp.'
      },
      {
        id: 'gps',
        icon: 'map-pin',
        title: 'GPS directo a Maps y Waze',
        description:
          'Tus invitados llegan sin contratiempos con botones nativos que abren la ruta exacta de ceremonia y recepción.'
      },
      {
        id: 'music',
        icon: 'music',
        title: 'Música de fondo envolvente',
        description:
          'Pantalla de bienvenida emocional que desbloquea la melodía del evento con control discreto de Play/Pause.'
      },
      {
        id: 'countdown',
        icon: 'clock',
        title: 'Cuenta regresiva en vivo',
        description:
          'Reloj dinámico en tiempo real con días, horas, minutos y segundos para alimentar la emoción previa al gran día.'
      },
      {
        id: 'eternal',
        icon: 'sparkles',
        title: 'Recuerdo eterno y ecológico',
        description:
          'Cero papel desperdiciado. Un enlace elegante que permanece vivo para revivir la fecha, el itinerario y los momentos.'
      }
    ],
    useCases: [
      { label: 'Bodas Civiles & Religiosas', detail: 'Editorial, botánica o black-tie' },
      { label: 'XV Años & Galas', detail: 'Vibrante, neón o imperial dorado' },
      { label: 'Bautizos & Cumpleaños', detail: 'Ilustrativo, tierno y familiar' },
      { label: 'Baby Showers & Aniversarios', detail: 'Listo para compartir en minutos' }
    ]
  };

  /**
   * Catálogo de Demos Interactivas
   * Orden de aparición en el Hub: ['boda', 'xv', 'cumpleanos']
   */
  EternoPase.DEMO_ORDER = ['boda', 'xv', 'cumpleanos'];

  EternoPase.DEMOS_CONFIG = {
    boda: {
      id: 'boda',
      route: 'boda.html',
      category: 'Boda',
      styleTag: 'Editorial Elegante',
      badge: 'Más solicitado',
      title: 'Valeria & Andrés',
      shortTitle: 'Boda Valeria & Andrés',
      subtitle: 'Nos casamos',
      dateDisplay: 'Sábado 24 de Abril de 2027 · 4:30 PM',
      cityDisplay: 'San Miguel de Allende, Gto.',
      eventDate: '2027-04-24T16:30:00-06:00',
      description:
        'Estética editorial botánica en verde olivo, terracota y crema con tipografía serif clásica.',
      og: {
        title: 'Valeria & Andrés | Nuestra Boda — Eterno Pase',
        description:
          'Acompáñanos a celebrar el inicio de nuestro para siempre el 24 de abril de 2027 en San Miguel de Allende.',
        image: 'assets/og-boda.svg'
      },
      colors: {
        primary: '#6B705C',
        secondary: '#CB997E',
        background: '#FAF8F5',
        surface: '#FFFFFF',
        text: '#2B2D26',
        muted: '#666A5D'
      },
      fonts: {
        display: "'Cormorant Garamond', Georgia, serif",
        body: "'Plus Jakarta Sans', system-ui, sans-serif",
        displayLabel: 'Cormorant Garamond',
        bodyLabel: 'Plus Jakarta Sans'
      },
      splash: {
        eyebrow: 'Invitación de Boda',
        headline: 'Valeria & Andrés',
        subtext: 'Con la bendición de Dios y nuestros padres, queremos compartir este día contigo.',
        buttonLabel: 'Abrir Invitación',
        sealText: 'V & A'
      },
      hero: {
        eyebrow: 'Save the Date · 24 · 04 · 2027',
        headline: 'Valeria & Andrés',
        quote:
          '“Dos historias que se encuentran para escribir un mismo capítulo que no se borra ni se olvida.”',
        rsvpDeadline: 'Confirmar antes del 25 de Marzo de 2027'
      },
      music: {
        title: 'Vals Botánico en Sol Mayor',
        artist: 'Cuerdas & Piano · Eterno Pase',
        preset: 'boda',
        customMp3Url: ''
      },
      hostsTitle: 'Con la bendición de nuestros padres',
      hosts: [
        {
          role: 'Padres de la Novia',
          names: 'Sra. Elena Ríos & Sr. Alejandro Montes'
        },
        {
          role: 'Padres del Novio',
          names: 'Sra. Carmen Delgado & Sr. Roberto Silva'
        },
        {
          role: 'Padrinos de Velación',
          names: 'Mariana Montes & Fernando Castillo'
        }
      ],
      locations: [
        {
          type: 'Ceremonia Religiosa',
          time: '4:30 PM',
          venue: 'Parroquia de San Miguel Arcángel',
          address: 'Principal s/n, Zona Centro, 37700 San Miguel de Allende, Gto.',
          mapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Parroquia+de+San+Miguel+Arcangel+San+Miguel+de+Allende',
          wazeUrl:
            'https://waze.com/ul?q=Parroquia%20de%20San%20Miguel%20Arcangel%20San%20Miguel%20de%20Allende&navigate=yes'
        },
        {
          type: 'Recepción & Banquete',
          time: '6:30 PM',
          venue: 'Hacienda Los Olivos',
          address: 'Camino Real a Alcocer Km 3.5, San Miguel de Allende, Gto.',
          mapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Hacienda+San+Miguel+de+Allende+Guanajuato',
          wazeUrl:
            'https://waze.com/ul?q=San%20Miguel%20de%20Allende%20Hacienda&navigate=yes'
        }
      ],
      itinerary: [
        {
          time: '16:30',
          title: 'Ceremonia Religiosa',
          description: 'Recepción en el atrio y entrada del cortejo nupcial.',
          icon: 'rings'
        },
        {
          time: '18:30',
          title: 'Cóctel en el Jardín de Olivos',
          description: 'Música acústica en vivo, mixología botánica y bocadillos.',
          icon: 'cocktail'
        },
        {
          time: '20:00',
          title: 'Cena Editorial a 3 Tiempos',
          description: 'Brindis de bienvenida y cena bajo pérgolas iluminadas.',
          icon: 'dinner'
        },
        {
          time: '21:30',
          title: 'Nuestro Primer Vals',
          description: 'Baile de los novios y apertura de la pista principal.',
          icon: 'music'
        },
        {
          time: '22:00',
          title: 'Fiesta Bajo las Estrellas',
          description: 'DJ en vivo, barra de café y tornaboda nocturna.',
          icon: 'sparkles'
        }
      ],
      dressCode: {
        title: 'Formal / Etiqueta Rigurosa',
        description:
          'Mujeres: vestido largo en tonos tierra, olivo, terracota o vino. Hombres: traje oscuro o smoking.',
        reservedNote: 'Colores reservados exclusivamente para la novia: Blanco, Marfil y Crema.',
        palette: [
          { name: 'Olivo', hex: '#6B705C' },
          { name: 'Terracota', hex: '#CB997E' },
          { name: 'Arena', hex: '#DDBEA9' },
          { name: 'Salvia', hex: '#A5A58D' }
        ]
      },
      gifts: {
        title: 'Mesa de Regalos & Lluvia de Sobres',
        subtitle:
          'Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nuestro nuevo hogar, puedes hacerlo aquí:',
        bank: 'BBVA México',
        beneficiary: 'Valeria Montes & Andrés Silva',
        clabe: '012180001234567895',
        concept: 'Boda Valeria y Andres',
        registries: [
          { label: 'Mesa Liverpool #51289401', url: 'https://mesaderegalos.liverpool.com.mx/' },
          { label: 'Lista Amazon Wedding', url: 'https://www.amazon.com.mx/wedding' }
        ]
      },
      rsvp: {
        title: 'Confirma tu Asistencia',
        subtitle: 'Queremos preparar tu lugar con todo el cariño. Responde en menos de 30 segundos.',
        maxGuests: 4,
        whatsappTarget: '5215657978859',
        songPlaceholder: 'Ej. La Vie En Rose / Todo Cambió — Camila'
      }
    },

    xv: {
      id: 'xv',
      route: 'xv.html',
      category: 'XV Años',
      styleTag: 'Gala Moderna / Vibrante',
      badge: 'Favorito Gala',
      title: 'Mis XV Sofía',
      shortTitle: 'Mis XV Sofía',
      subtitle: 'Una noche para brillar',
      dateDisplay: 'Sábado 15 de Mayo de 2027 · 6:00 PM',
      cityDisplay: 'Guadalajara, Jalisco',
      eventDate: '2027-05-15T18:00:00-06:00',
      description:
        'Atmósfera nocturna vibrante en púrpura profundo y dorado champagne con contraste editorial.',
      og: {
        title: 'Mis XV Sofía | Noche de Gala — Eterno Pase',
        description:
          'Te invito a celebrar mis XV años el sábado 15 de mayo de 2027. Confirma tu pase y sugiere tu canción favorita.',
        image: 'assets/og-xv.svg'
      },
      colors: {
        primary: '#2D1B4E',
        secondary: '#D4AF37',
        background: '#120924',
        surface: '#1E1138',
        text: '#F9F5FF',
        muted: '#D5C7EA'
      },
      fonts: {
        display: "'Playfair Display', Georgia, serif",
        body: "'Montserrat', system-ui, sans-serif",
        displayLabel: 'Playfair Display',
        bodyLabel: 'Montserrat'
      },
      splash: {
        eyebrow: 'Mis Quince Años',
        headline: 'Sofía Valentina',
        subtext: 'Hay momentos que brillan una vez en la vida y merecen recordarse por siempre.',
        buttonLabel: 'Abrir Invitación',
        sealText: 'XV'
      },
      hero: {
        eyebrow: 'Noche Imperial · 15 · 05 · 2027',
        headline: 'Mis XV Sofía',
        quote:
          '“Hoy dejo atrás los pasos de niña para celebrar los sueños que comienzan a florecer bajo las luces de esta noche.”',
        rsvpDeadline: 'Confirmar antes del 20 de Abril de 2027'
      },
      music: {
        title: 'Noche Imperial Champagne',
        artist: 'Gala Waltz · Eterno Pase',
        preset: 'xv',
        customMp3Url: ''
      },
      hostsTitle: 'Con el amor de mi familia',
      hosts: [
        {
          role: 'Mis Padres',
          names: 'Lorena Mendoza & Ricardo Herrera'
        },
        {
          role: 'Mis Padrinos',
          names: 'Claudia Herrera & Sergio Domínguez'
        }
      ],
      locations: [
        {
          type: 'Misa de Acción de Gracias',
          time: '6:00 PM',
          venue: 'Basílica de Nuestra Señora de Zapopan',
          address: 'Eva Briseño 152, Zapopan Centro, 45100 Zapopan, Jal.',
          mapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Basilica+de+Zapopan+Jalisco',
          wazeUrl:
            'https://waze.com/ul?q=Basilica%20de%20Zapopan%20Jalisco&navigate=yes'
        },
        {
          type: 'Gala & Recepción',
          time: '8:00 PM',
          venue: 'Palacio de Cristal Grand Salón',
          address: 'Av. Patria 1920, Col. Royal Country, Guadalajara, Jal.',
          mapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Avenida+Patria+Zapopan+Guadalajara',
          wazeUrl:
            'https://waze.com/ul?q=Avenida%20Patria%20Guadalajara&navigate=yes'
        }
      ],
      itinerary: [
        {
          time: '18:00',
          title: 'Misa de Acción de Gracias',
          description: 'Ceremonia religiosa y entrega de ramo y medalla.',
          icon: 'sparkles'
        },
        {
          time: '20:00',
          title: 'Alfombra Dorada & Photo Spot',
          description: 'Bienvenida con bebidas de autor y sesión de fotos 360°.',
          icon: 'camera'
        },
        {
          time: '21:00',
          title: 'Entrada Triunfal & Vals',
          description: 'Presentación oficial, vals familiar y baile sorpresa.',
          icon: 'music'
        },
        {
          time: '22:00',
          title: 'Cena de Gala',
          description: 'Menú gourmet y brindis dorado en honor a Sofía.',
          icon: 'dinner'
        },
        {
          time: '23:00',
          title: 'After Party & DJ Live',
          description: 'Pista LED abierta, batucada neón y mesa de snacks.',
          icon: 'party'
        }
      ],
      dressCode: {
        title: 'Gala de Noche / Formal Glam',
        description:
          'Mujeres: vestido largo o midi de noche. Hombres: traje formal oscuro o smoking.',
        reservedNote: 'Tonos reservados para Sofía: Púrpura Imperial y Dorado Champagne.',
        palette: [
          { name: 'Negro Gala', hex: '#18181B' },
          { name: 'Plata', hex: '#C0C0C0' },
          { name: 'Vino', hex: '#722F37' },
          { name: 'Azul Noche', hex: '#1B263B' }
        ]
      },
      gifts: {
        title: 'Lluvia de Sobres & Detalles',
        subtitle:
          'El mejor regalo es verte bailar conmigo. Si deseas consentirme con un detalle para mi próximo viaje, te comparto los datos:',
        bank: 'Santander México',
        beneficiary: 'Sofía Valentina Herrera',
        clabe: '014180605040302019',
        concept: 'XV Sofia Valentina',
        registries: [
          { label: 'Mesa Palacio de Hierro #884120', url: 'https://www.elpalaciodehierro.com/' }
        ]
      },
      rsvp: {
        title: 'Confirma tu Pase VIP',
        subtitle: 'Asegura tu lugar en la lista de invitados y elige la canción que no puede faltar.',
        maxGuests: 5,
        whatsappTarget: '5215657978859',
        songPlaceholder: 'Ej. Dancing Queen / Tití Me Preguntó'
      }
    },

    cumpleanos: {
      id: 'cumpleanos',
      route: 'cumpleanos.html',
      category: 'Cumpleaños Infantil / Bautizo',
      styleTag: 'Tierno / Temático Celeste',
      badge: 'Súper Tierno',
      title: 'Cumpleaños #3 de Mateo',
      shortTitle: 'Cumple #3 de Mateo',
      subtitle: '¡Una aventura entre nubes!',
      dateDisplay: 'Domingo 14 de Marzo de 2027 · 1:30 PM',
      cityDisplay: 'Polanco, Ciudad de México',
      eventDate: '2027-03-14T13:30:00-06:00',
      description:
        'Diseño alegre y dulce en azul cielo pastel, amarillo suave y blanco cálido con tipografía amigable.',
      og: {
        title: 'Cumpleaños #3 de Mateo | Invitación Digital — Eterno Pase',
        description:
          'Ven a jugar, reír y partir el pastel en los 3 añitos de Mateo el 14 de marzo de 2027. ¡Te esperamos!',
        image: 'assets/og-cumpleanos.svg'
      },
      colors: {
        primary: '#A2D2FF',
        secondary: '#FFD166',
        background: '#FFFDF9',
        surface: '#FFFFFF',
        text: '#1D3557',
        muted: '#457B9D'
      },
      fonts: {
        display: "'Fredoka', 'Quicksand', sans-serif",
        body: "'Plus Jakarta Sans', system-ui, sans-serif",
        displayLabel: 'Fredoka / Quicksand',
        bodyLabel: 'Plus Jakarta Sans'
      },
      splash: {
        eyebrow: '¡Estás invitado!',
        headline: 'Mateo cumple 3',
        subtext: 'Prepara tu sonrisa porque te espera una tarde llena de juegos, magia y pastel.',
        buttonLabel: 'Abrir Invitación',
        sealText: '3 años'
      },
      hero: {
        eyebrow: 'Domingo 14 de Marzo · 2027',
        headline: 'Cumpleaños #3 de Mateo',
        quote:
          '“Tres años llenando nuestra casa de risas, abrazos gigantes y pequeñas grandes aventuras.”',
        rsvpDeadline: 'Confirmar antes del 1 de Marzo de 2027'
      },
      music: {
        title: 'Aventura entre las Nubes',
        artist: 'Caja Musical Celeste · Eterno Pase',
        preset: 'cumpleanos',
        customMp3Url: ''
      },
      hostsTitle: 'Con todo el cariño te invitan',
      hosts: [
        {
          role: 'Sus Papás',
          names: 'Sofía Ramírez & Daniel Morales'
        },
        {
          role: 'Sus Padrinos de Bautizo',
          names: 'Andrea Ramírez & Carlos Vega'
        }
      ],
      locations: [
        {
          type: 'Bendición de Agradecimiento',
          time: '1:30 PM',
          venue: 'Capilla Santa María de los Ángeles',
          address: 'Horacio 412, Polanco, 11560 Ciudad de México, CDMX.',
          mapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Polanco+Ciudad+de+Mexico+Iglesia',
          wazeUrl:
            'https://waze.com/ul?q=Polanco%20Ciudad%20de%20Mexico&navigate=yes'
        },
        {
          type: 'Fiesta & Área de Juegos',
          time: '2:30 PM',
          venue: 'Jardín Infantil Pequeñas Estrellas',
          address: 'Av. Emilio Castelar 185, Polanco, Miguel Hidalgo, CDMX.',
          mapsUrl:
            'https://www.google.com/maps/search/?api=1&query=Emilio+Castelar+Polanco+CDMX',
          wazeUrl:
            'https://waze.com/ul?q=Emilio%20Castelar%20Polanco%20CDMX&navigate=yes'
        }
      ],
      itinerary: [
        {
          time: '14:30',
          title: 'Bienvenida & Pintacaritas',
          description: 'Entrega de globos, estación de tatuajes lavables y snacks.',
          icon: 'balloon'
        },
        {
          time: '15:30',
          title: 'Show de Magia y Burbujas',
          description: 'Espectáculo interactivo familiar en el jardín principal.',
          icon: 'sparkles'
        },
        {
          time: '16:30',
          title: 'Comida & Mesa de Dulces',
          description: 'Menú para grandes y chicos con barra de aguas frescas.',
          icon: 'dinner'
        },
        {
          time: '17:30',
          title: '¡A Romper la Piñata!',
          description: 'Todos los peques listos con su bolsita para la lluvia de dulces.',
          icon: 'party'
        },
        {
          time: '18:15',
          title: 'Pastel y Velita #3',
          description: 'Las Mañanitas para Mateo y entrega de cajitas sorpresa.',
          icon: 'cake'
        }
      ],
      dressCode: {
        title: 'Casual Cómodo & Tonos Pastel',
        description:
          'Vengan cómodos para correr, brincar y disfrutar del jardín sin preocupaciones.',
        reservedNote: 'Sugerencia amigable: tenis o zapato bajo y suéter ligero para la tarde.',
        palette: [
          { name: 'Cielo', hex: '#A2D2FF' },
          { name: 'Sol Suave', hex: '#FFD166' },
          { name: 'Menta', hex: '#BDE0FE' },
          { name: 'Arena', hex: '#FDE4CF' }
        ]
      },
      gifts: {
        title: 'Mesa de Regalos & Sobrecito',
        subtitle:
          'Lo más importante es pasar la tarde jugando contigo. Si quieres darle un obsequio a Mateo, aquí tienes algunas ideas:',
        bank: 'Banorte',
        beneficiary: 'Familia Morales (Regalo de Mateo)',
        clabe: '072180009876543210',
        concept: 'Cumple 3 Mateo',
        extraNotes: [
          'Talla de ropa: 3 a 4 años',
          'Le encantan: Dinosaurios, bloques armables y cuentos ilustrados'
        ],
        registries: [
          { label: 'Lista Amazon Kids Mateo', url: 'https://www.amazon.com.mx/' }
        ]
      },
      rsvp: {
        title: 'Confirma tu Asistencia',
        subtitle: 'Ayúdanos a contar las bolsitas de dulces y lugares en la mesa.',
        maxGuests: 6,
        whatsappTarget: '5215657978859',
        songPlaceholder: 'Ej. Baby Shark / Libre Soy / Las Mañanitas'
      }
    }
  };
})(window);
