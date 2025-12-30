



# ==============================================================================
# 2. INSERTAR DOCENTES
# ==============================================================================
def insertDoc(connection, intoData):
        cursor = connection.cursor()
        docTup = []
    
        for doc in intoData:
        # Validar que existan datos antes de hacer split
            nombre_raw = str(doc[1]).strip() if doc[1] else ""
            apellido_raw = str(doc[0]).strip() if doc[0] else ""
            
            if not nombre_raw or not apellido_raw:
                print(f"⚠️ Docente omitido por datos incompletos: {doc}")
                continue

            nom_pila = nombre_raw.split()[0]
            ape_pila = apellido_raw.split()[0]
            
            nom_completo = f"{nom_pila} {ape_pila}"
            docTup.append((nom_completo,))
        
        cursor.executemany("INSERT IGNORE INTO docentes (nombre) VALUES (%s)", docTup)
        connection.commit()
        print(f"Se insertaron {cursor.rowcount} docentes correctamente.")