


def insertAsign(connection,intoData):
    cursor = connection.cursor()
    
    for reg in intoData:
        print(reg)